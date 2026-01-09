package com.dealhub.extraction.service;

import com.dealhub.extraction.model.ExtractionProfile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LlmExtractionService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public LlmExtractionService(ChatClient.Builder chatClientBuilder, ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public JsonNode extractFacilityAgreement(
            ExtractionProfile profile,
            Long documentId,
            Long agreementId,
            List<String> chunks
    ) throws Exception {

        ObjectNode merged = objectMapper.createObjectNode();
        merged.put("profile", profile.name());
        merged.put("documentId", documentId);
        merged.put("agreementId", agreementId);

        // ensure predictable structure
        merged.set("parties", objectMapper.createObjectNode());
        merged.set("keyDates", objectMapper.createObjectNode());
        merged.set("facilities", objectMapper.createArrayNode());
        merged.set("pricing", objectMapper.createObjectNode());
        merged.set("interestPeriods", objectMapper.createArrayNode());

        for (int i = 0; i < chunks.size(); i++) {
            JsonNode partial = extractFromChunk(profile, documentId, agreementId, chunks.get(i), i + 1, chunks.size());
            merged = mergeJson(merged, partial);
        }

        return merged;
    }

    private JsonNode extractFromChunk(
            ExtractionProfile profile,
            Long documentId,
            Long agreementId,
            String chunk,
            int chunkIndex,
            int totalChunks
    ) throws Exception {

        String schemaHint = """
        Return ONLY valid JSON (no markdown, no comments).
        Fill fields ONLY if present in text. If unknown, omit the field (do not invent).
        
        Expected top-level keys:
        - profile (string)
        - documentId (number)
        - agreementId (number)
        - parties { borrowerName, administrativeAgentName, lenders:[{name, shareAmount, sharePercentage}] }
        - keyDates { agreementDate, effectiveDate, expiryDate, maturityDate }
        - facilities: [{ facilityType, currency, amount }]
        - pricing: { baseRate, margin }
        - interestPeriods: [ "1M", "3M", ... ]
        """;

        String userPrompt = """
        You are extracting data from a Facility Agreement.
        
        Context:
        - profile: %s
        - documentId: %d
        - agreementId: %d
        - chunk: %d / %d
        
        %s
        
        TEXT:
        %s
        """.formatted(profile.name(), documentId, agreementId, chunkIndex, totalChunks, schemaHint, chunk);

        String raw = chatClient.prompt()
                .system("You are a precise legal contract extraction engine. Output ONLY JSON.")
                .user(userPrompt)
                .call()
                .content();

        return objectMapper.readTree(raw);
    }

    // deep merge objects, append arrays
    private ObjectNode mergeJson(ObjectNode base, JsonNode patch) {
        if (patch == null || !patch.isObject()) return base;

        patch.fields().forEachRemaining(e -> {
            String key = e.getKey();
            JsonNode val = e.getValue();

            if (!base.has(key) || base.get(key).isNull()) {
                base.set(key, val);
                return;
            }

            JsonNode existing = base.get(key);

            if (existing.isObject() && val.isObject()) {
                mergeJson((ObjectNode) existing, val);
            } else if (existing.isArray() && val.isArray()) {
                val.forEach(((com.fasterxml.jackson.databind.node.ArrayNode) existing)::add);
            } else {
                base.set(key, val);
            }
        });

        return base;
    }
}
