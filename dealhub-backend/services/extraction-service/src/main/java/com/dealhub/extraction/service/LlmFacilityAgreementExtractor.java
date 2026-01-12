package com.dealhub.extraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LlmFacilityAgreementExtractor {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private static final String SYSTEM_RULES_GPT4O_MINI = """
SYSTEM ROLE OVERRIDE:
You are a deterministic legal data extraction engine.

ABSOLUTE OUTPUT:
- Return ONLY valid JSON. No prose. No markdown.
- Use ONLY the provided text. Do NOT guess. Do NOT use outside knowledge.
- Do NOT fabricate citations or evidence.

EVIDENCE AND CITATION:
- Every extracted leaf value MUST be an object:
  { "value": "...", "citation": "...", "evidence": "..." }
- evidence MUST be a verbatim quote from the provided text (max 25 words).
- citation MUST be the best reference stated or clearly implied by the text:
  examples: "Schedule 1 Part I", "Clause 9", "Definitions", "Parties section", "Cover page".
- If you cannot provide verbatim evidence for a value, you MUST NOT populate that value.

PLACEHOLDERS:
- If the text shows a placeholder (example "[●]", "__ July 2024", "TBD"):
  value = "Not defined / Placeholder"
  evidence MUST quote the placeholder verbatim.
- If an explicit non-placeholder value exists later (in the same provided text for this step),
  you MUST use the explicit value and IGNORE the placeholder.

CALCULATIONS:
- You may calculate ONLY lender sharePercentage when:
  (1) lender commitment amount is explicitly stated, AND
  (2) total commitments is explicitly stated (in this step’s provided inputs).
- If you calculate:
  - value must be a STRING: "Calculated: 12.34 percent"
  - evidence MUST include short verbatim quotes for BOTH lender amount AND total commitments.
- Do NOT calculate otherwise.

SCHEMA:
- Follow the TARGET SCHEMA exactly.
- No extra keys, no renamed keys.
""";

    private static final String PASS1_TEMPLATE = """
You are extracting data for a Facility Agreement.

OUTPUT RULES (NON-NEGOTIABLE):
- Output VALID JSON ONLY
- No prose, no markdown
- Use ONLY the DOCUMENT CHUNK text
- Every extracted value MUST include {value,citation,evidence}

Chunk index: %d

DOCUMENT CHUNK:
<<<CHUNK_START
%s
CHUNK_END>>>

TARGET SCHEMA:
%s

MANDATORY EXTRACTION RULES:

1) PLACEHOLDER OVERRIDE
If a date appears as "__ July 2024" or "[●]" AND an explicit date exists later in THIS chunk,
extract the explicit date and IGNORE the placeholder.

2) FACILITY (REQUIRED IF "Total Commitments" EXISTS)
If "Total Commitments" appears in this chunk, you MUST extract:
- facilities[0].amount
- facilities[0].currency (example: "Sterling" only if explicitly present)
- facilities[0].facilityType (example: "multicurrency term loan facility" only if explicitly present)

3) PRICING MARGIN TABLE (MANDATORY)
If the word "Margin" appears with a table, you MUST extract EVERY row into pricing.margin[].
Do NOT summarize. Do NOT omit rows.

For EACH margin row extract:
- period (1,2,3,...)
- timeRange.from
- timeRange.to
- sterlingMargin (exact text as written)

TIME RANGE NORMALIZATION (MANDATORY):
- First row: from = "0 months"
- Next rows: from = ">3 months", ">6 months", ">9 months", etc
- "to" is the upper bound in months, written like "3 months", "6 months", "9 months", "12 months"

4) LENDERS
If lender commitment AND total commitments exist in this chunk:
- sharePercentage MUST be calculated
- value format: "Calculated: XX.XX percent"
- evidence MUST include lender commitment quote AND total commitments quote in a single evidence string

5) NULL IS NOT ALLOWED FOR SUPPORTED FIELDS
If a schema field is supported by this chunk, you MUST populate it.
Only use null if the concept is completely absent in this chunk.

OUTPUT:
- Return ONE JSON object
- Include ONLY keys from TARGET SCHEMA
- If nothing is extractable, return {}
""";

    // PASS 2 merge prompt template (gpt-4o-mini hardened)
    private static final String MERGE_TEMPLATE = """
You are merging extracted legal data into ONE FINAL JSON object.

OUTPUT RULES (NON-NEGOTIABLE):
- Output VALID JSON ONLY
- No prose, no markdown
- Output MUST match TARGET SCHEMA EXACTLY (all keys/structure)
- Never invent values. Never invent evidence.

TARGET SCHEMA:
%s

GLOBAL TOTAL COMMITMENTS (may be empty):
%s

PER-CHUNK EXTRACTS:
%s

MERGE RULES (STRICT):
1) Never replace populated values with null
2) Explicit dates override placeholders
3) pricing.margin arrays MUST be preserved fully (do not drop rows)
4) facilities MUST include amount, currency, facilityType if they exist in any chunk extraction
5) For calculated sharePercentage:
   - value must be "Calculated: XX.XX percent"
   - evidence MUST include BOTH lender commitment AND total commitments quotes
6) Lender merge:
   - merge by exact lender legal name string match
   - preserve shareAmount/shareCurrency/sharePercentage if present

If a field has no supported evidence across all chunks, set it to null (do NOT write sentences).

OUTPUT:
- Return ONE JSON object only
""";

    public LlmFacilityAgreementExtractor(ChatClient.Builder chatClientBuilder, ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public JsonNode extract(String schema, long documentId, long agreementId, List<String> chunks) throws Exception {

        // ====== PASS 1: per-chunk structured extraction ======
        ArrayNode chunkExtractions = objectMapper.createArrayNode();

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);

            String userPrompt = PASS1_TEMPLATE.formatted(i + 1, chunk, schema);

            String raw = chatClient.prompt()
                    .system(SYSTEM_RULES_GPT4O_MINI)
                    .user(userPrompt)
                    .call()
                    .content();

            JsonNode one = safeParseJson(raw);

            if (one != null && one.isObject()) {
                ((ObjectNode) one).put("_chunkIndex", i + 1);
            }

            chunkExtractions.add(one == null ? objectMapper.createObjectNode() : one);
        }

        // ====== PASS 1.5: Extract Total Commitments globally (used for % calc in merge) ======
        ObjectNode totals = extractTotalCommitmentsFromAllChunks(chunks);

        // ====== PASS 2: merge to final schema EXACTLY ======
        String mergePrompt = MERGE_TEMPLATE.formatted(schema, totals.toString(), chunkExtractions.toString());

        String mergedRaw = chatClient.prompt()
                .system(SYSTEM_RULES_GPT4O_MINI)
                .user(mergePrompt)
                .call()
                .content();

        JsonNode merged = safeParseJson(mergedRaw);
        if (merged == null || !merged.isObject()) {
            throw new IllegalStateException("LLM merge step did not return a JSON object.");
        }

        ObjectNode mergedObj = (ObjectNode) merged;

        // schema-safe identifiers
        if (mergedObj.has("documentId")) mergedObj.put("documentId", documentId);
        if (mergedObj.has("agreementId")) mergedObj.put("agreementId", agreementId);
        if (mergedObj.has("profile") && !mergedObj.hasNonNull("profile")) {
            mergedObj.put("profile", "FACILITY_AGREEMENT");
        }

        return mergedObj;
    }

    private ObjectNode extractTotalCommitmentsFromAllChunks(List<String> chunks) throws Exception {
        StringBuilder all = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            all.append("\n\n[CHUNK ").append(i + 1).append("]\n").append(chunks.get(i));
        }

        String prompt = """
Find "Total Commitments" amount if explicitly stated anywhere in the provided text.

OUTPUT RULES:
- Return JSON ONLY
- Return either {} OR:
  {"totalCommitments": {"value":"...","citation":"...","evidence":"..."}}

EVIDENCE:
- evidence must be verbatim quote (max 25 words)
- do NOT guess

DOCUMENT:
%s
""".formatted(all.toString());

        String raw = chatClient.prompt()
                .system(SYSTEM_RULES_GPT4O_MINI)
                .user(prompt)
                .call()
                .content();

        JsonNode node = safeParseJson(raw);
        if (node != null && node.isObject()) return (ObjectNode) node;
        return objectMapper.createObjectNode();
    }

    private JsonNode safeParseJson(String raw) throws Exception {
        if (raw == null) return null;
        String s = raw.trim();

        // Strip fenced code blocks if any
        if (s.startsWith("```")) {
            s = s.replaceFirst("^```[a-zA-Z]*\\s*", "");
            s = s.replaceFirst("\\s*```\\s*$", "");
            s = s.trim();
        }

        // Best-effort trim to first JSON token
        int objStart = s.indexOf('{');
        int arrStart = s.indexOf('[');
        int start;
        if (objStart >= 0 && arrStart >= 0) start = Math.min(objStart, arrStart);
        else start = Math.max(objStart, arrStart);
        if (start > 0) s = s.substring(start).trim();

        // Best-effort trim to last JSON closing token
        int objEnd = s.lastIndexOf('}');
        int arrEnd = s.lastIndexOf(']');
        int end = Math.max(objEnd, arrEnd);
        if (end >= 0 && end + 1 < s.length()) s = s.substring(0, end + 1).trim();

        return objectMapper.readTree(s);
    }
}
