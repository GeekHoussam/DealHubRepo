package com.dealhub.agreement.lenderdist;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.*;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Iterator;
import java.util.Locale;

@Component
public class LenderPayloadViewMapper {

    private final ObjectMapper mapper;

    public LenderPayloadViewMapper(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * Build lender-facing payload from full extracted payload.
     * Input = full extraction JSON (your big object)
     * Output = small lender view payload
     */
    public ObjectNode buildLenderView(JsonNode fullPayload, String lenderEmail, String inboxDealName) {
        ObjectNode out = mapper.createObjectNode();

        // -------------------------
        // Root fields
        // -------------------------
        out.put("dealName", StringUtils.hasText(inboxDealName) ? inboxDealName : "Facility Agreement");

        JsonNode parties = fullPayload.path("parties");
        String borrowerName = textOrNull(parties, "borrowerName");
        String agentName = textOrNull(parties, "administrativeAgentName");

        // -------------------------
        // Find lender entry
        // -------------------------
        JsonNode lenderEntry = findLenderEntry(parties.path("lenders"), lenderEmail);

        String lenderName = lenderEntry != null ? textOrNull(lenderEntry, "name") : null;
        if (!StringUtils.hasText(lenderName)) {
            lenderName = deriveDisplayNameFromEmail(lenderEmail);
        }
        out.put("lender", lenderName);

        // -------------------------
        // borrower
        // -------------------------
        ObjectNode borrower = mapper.createObjectNode();
        borrower.put("legalName", borrowerName);
        borrower.set("otherLegalDetails", NullNode.instance);
        out.set("borrower", borrower);

        // -------------------------
        // roles
        // -------------------------
        ObjectNode roles = mapper.createObjectNode();
        roles.put("agent", agentName);
        roles.set("arrangers", NullNode.instance);
        roles.put("lenderRole", "Original Lender");
        out.set("roles", roles);

        // -------------------------
        // participation
        // -------------------------
        ObjectNode participation = mapper.createObjectNode();

        String commitmentAmount = null;
        String sharePct = null;

        if (lenderEntry != null) {
            commitmentAmount = lenderEntry.path("shareAmount").path("value").asText(null);

            String rawPct = lenderEntry.path("sharePercentage").path("value").asText(null);
            sharePct = normalizeSharePercentage(rawPct);
        }

        participation.put("commitmentAmount", commitmentAmount);

        // currency: prefer facilities[0].currency or infer from £
        String commitmentCurrency = inferCurrencyFromAmount(commitmentAmount);
        participation.put("commitmentCurrency", commitmentCurrency);

        participation.put("sharePercentage", sharePct);
        out.set("participation", participation);

        // -------------------------
        // facility (total size)
        // -------------------------
        ObjectNode facility = mapper.createObjectNode();

        String totalSize = extractTotalSize(fullPayload, parties);
        facility.put("totalSize", totalSize);

        String facilityCurrency = textOrNullFromFacilities(fullPayload, "currency");
        if (!StringUtils.hasText(facilityCurrency)) {
            facilityCurrency = inferCurrencyFromAmount(totalSize);
        }
        facility.put("currency", normalizeCurrency(facilityCurrency));

        String facilityType = textOrNullFromFacilities(fullPayload, "facilityType");
        facility.put("type", normalizeFacilityType(facilityType));
        out.set("facility", facility);

        out.set("purpose", NullNode.instance);

        // -------------------------
        // dates (best-effort)
        // -------------------------
        ObjectNode dates = mapper.createObjectNode();
        JsonNode keyDates = fullPayload.path("keyDates");
        String signingDate = keyDates.path("agreementDate").path("value").asText(null);
        dates.put("signingDate", normalizeDateOrNull(signingDate));
        dates.set("closingDate", NullNode.instance);
        dates.set("terminationDateInitial", NullNode.instance);
        dates.set("terminationDateExtended", NullNode.instance);
        out.set("dates", dates);

        out.set("availabilityAndUtilization", NullNode.instance);

        // -------------------------
        // pricing.marginGrid
        // expects: [{period, margin}]
        // -------------------------
        ObjectNode pricing = mapper.createObjectNode();
        ArrayNode marginGrid = mapper.createArrayNode();

        JsonNode pricingNode = fullPayload.path("pricing");
        JsonNode marginArray = pricingNode.path("margin");

        if (marginArray.isArray()) {
            for (JsonNode m : marginArray) {
                String period = m.path("period").asText(null);
                String margin = m.path("sterlingMargin").asText(null);

                // your extractor may use different keys; add fallback:
                if (!StringUtils.hasText(margin)) margin = m.path("margin").asText(null);

                if (StringUtils.hasText(period) || StringUtils.hasText(margin)) {
                    ObjectNode row = mapper.createObjectNode();
                    row.put("period", period);
                    row.put("margin", margin);
                    marginGrid.add(row);
                }
            }
        }

        pricing.set("marginGrid", marginGrid);
        pricing.set("ratingAdjustmentRules", NullNode.instance);
        out.set("pricing", pricing);

        // -------------------------
        // fees + dayCountConvention
        // -------------------------
        ObjectNode fees = mapper.createObjectNode();
        fees.set("upfrontFee", NullNode.instance);
        fees.set("agencyFee", NullNode.instance);
        fees.set("tickingFee", NullNode.instance);
        out.set("fees", fees);

        out.set("dayCountConvention", NullNode.instance);

        return out;
    }

    // =========================
    // Helpers
    // =========================

    private JsonNode findLenderEntry(JsonNode lendersArray, String lenderEmail) {
        if (lendersArray == null || !lendersArray.isArray() || !StringUtils.hasText(lenderEmail)) return null;

        String local = lenderEmail.split("@")[0].toLowerCase(Locale.ROOT);
        String localNorm = normalize(local);

        // try match by tokens from email (bnp.paribas -> "bnp" + "paribas")
        for (JsonNode l : lendersArray) {
            String name = l.path("name").asText("");
            String nameNorm = normalize(name);

            // if all email tokens appear in lender name
            if (allTokensPresent(localNorm, nameNorm)) {
                return l;
            }
        }

        // fallback: exact-ish contains
        for (JsonNode l : lendersArray) {
            String name = l.path("name").asText("");
            if (normalize(name).contains(localNorm.replace(" ", ""))) {
                return l;
            }
        }

        return null;
    }

    private boolean allTokensPresent(String emailNorm, String nameNorm) {
        String[] tokens = emailNorm.split("\\s+");
        int hits = 0;
        for (String t : tokens) {
            if (!StringUtils.hasText(t)) continue;
            if (nameNorm.contains(t)) hits++;
        }
        return hits >= Math.max(1, tokens.length); // usually 2 tokens for bnp paribas
    }

    private String normalize(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT)
                .replace(".", " ")
                .replace("_", " ")
                .replace("-", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String deriveDisplayNameFromEmail(String email) {
        if (!StringUtils.hasText(email)) return null;
        String local = email.split("@")[0];
        local = local.replace(".", " ").replace("_", " ").replace("-", " ");
        String[] parts = local.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!StringUtils.hasText(p)) continue;
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1)).append(" ");
        }
        return sb.toString().trim();
    }

    private String textOrNull(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asText(null);
        return StringUtils.hasText(s) ? s : null;
    }

    private String extractTotalSize(JsonNode full, JsonNode parties) {
        // Prefer facilities[0].amount.value
        JsonNode facilities = full.path("facilities");
        if (facilities.isArray() && facilities.size() > 0) {
            String v = facilities.get(0).path("amount").path("value").asText(null);
            if (StringUtils.hasText(v)) return v;
        }

        // fallback: first lenders entry "Total Commitments" style
        JsonNode lenders = parties.path("lenders");
        if (lenders.isArray() && lenders.size() > 0) {
            String v = lenders.get(0).path("shareAmount").path("value").asText(null);
            if (StringUtils.hasText(v)) return v;
        }

        return null;
    }

    private String textOrNullFromFacilities(JsonNode full, String field) {
        JsonNode facilities = full.path("facilities");
        if (facilities.isArray() && facilities.size() > 0) {
            String v = facilities.get(0).path(field).asText(null);
            return StringUtils.hasText(v) ? v : null;
        }
        return null;
    }

    private String inferCurrencyFromAmount(String amount) {
        if (!StringUtils.hasText(amount)) return "GBP";
        if (amount.contains("£")) return "GBP";
        if (amount.contains("$")) return "USD";
        if (amount.contains("€")) return "EUR";
        return "GBP";
    }

    private String normalizeCurrency(String c) {
        if (!StringUtils.hasText(c)) return "GBP";
        String x = c.trim().toUpperCase(Locale.ROOT);
        if ("STERLING".equals(x) || "GBP".equals(x)) return "GBP";
        return x;
    }

    private String normalizeFacilityType(String type) {
        if (!StringUtils.hasText(type)) return null;
        // Basic normalization like your expected example casing
        String t = type.trim();
        if (t.equalsIgnoreCase("multicurrency term loan facility")) {
            return "Multicurrency Term Loan Facility";
        }
        return t;
    }

    private String normalizeSharePercentage(String raw) {
        if (!StringUtils.hasText(raw)) return null;

        // e.g. "Calculated: 33.33 percent"
        String s = raw.trim();
        boolean calculated = s.toLowerCase(Locale.ROOT).contains("calculated");

        // extract number
        String num = s.replaceAll("[^0-9.]", "");
        if (!StringUtils.hasText(num)) return raw;

        try {
            BigDecimal bd = new BigDecimal(num).setScale(2, RoundingMode.HALF_UP);
            return bd.toPlainString() + "% (Calculated)";
        } catch (Exception e) {
            return raw;
        }
    }

    private String normalizeDateOrNull(String v) {
        if (!StringUtils.hasText(v)) return null;
        String s = v.trim();
        if (s.equalsIgnoreCase("Not defined / Placeholder")) return null;
        if (s.contains("__")) return null;
        return s;
    }
}
