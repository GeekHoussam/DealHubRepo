package com.dealhub.agreement.lenderdist;

import com.dealhub.agreement.lenderregistry.LenderResolverService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class LenderPayloadDistributor {

    private static final Logger log = LoggerFactory.getLogger(LenderPayloadDistributor.class);

    private final LenderResolverService resolver;
    private final RestClient rest;

    @Value("${app.lenderdist.base-url:http://localhost:8080}") // via gateway
    private String baseUrl;

    @Value("${app.lenderdist.inbox-path:/lender-payloads/inbox}")
    private String inboxPath;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public LenderPayloadDistributor(LenderResolverService resolver, RestClient.Builder builder) {
        this.resolver = resolver;
        this.rest = builder.build();
    }

    /**
     * Distribute lender-specific extracted payloads.
     * IMPORTANT: This method does NOT guess. Unresolved lenders are skipped (and logged).
     */
    public void distributeLenderPayloads(Long agreementId, Long versionId, JsonNode extractedJson) {
        final String dealName = "Facility Agreement";

        if (extractedJson == null || extractedJson.isNull()) {
            log.warn("[LENDER-DIST] agreementId={} versionId={} extractedJson is null; skip", agreementId, versionId);
            return;
        }

        JsonNode lendersNode = extractedJson.path("parties").path("lenders");
        if (!(lendersNode instanceof ArrayNode lenders) || lenders.isEmpty()) {
            log.info("[LENDER-DIST] agreementId={} versionId={} No lenders found at extractedJson.parties.lenders",
                    agreementId, versionId);
            return;
        }

        final String url = baseUrl + inboxPath;

        for (int i = 0; i < lenders.size(); i++) {
            JsonNode lenderPayload = lenders.get(i);

            String lenderName = extractLenderName(lenderPayload);
            if (lenderName == null || lenderName.isBlank()) {
                log.warn("[LENDER-DIST] agreementId={} versionId={} lenderIndex={} Missing lender name; skipping",
                        agreementId, versionId, i);
                continue;
            }

            LenderResolverService.Resolution res = resolver.resolve(lenderName);

            if (res.matchType() == LenderResolverService.MatchType.UNRESOLVED) {
                log.warn("[LENDER-DIST] UNRESOLVED agreementId={} versionId={} lenderIndex={} raw='{}' norm='{}' reason='{}' bestScore={}",
                        agreementId, versionId, i, res.rawName(), res.normalizedName(), res.reason(), res.score());
                // Optional: persist audit record here
                continue;
            }

            var req = new LenderPayloadDispatchRequest(
                    dealName,
                    res.lenderId(),
                    res.recipientEmail(),
                    lenderPayload
            );

            try {
                var resp = rest.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-INTERNAL-KEY", internalKey)
                        .body(req)
                        .retrieve()
                        .toBodilessEntity();

                log.info("[LENDER-DIST] SENT agreementId={} versionId={} lenderIndex={} lenderId={} email={} matchType={} score={} http={}",
                        agreementId, versionId, i, res.lenderId(), res.recipientEmail(), res.matchType(), res.score(),
                        resp.getStatusCode().value());

            } catch (Exception e) {
                log.warn("[LENDER-DIST] FAILED agreementId={} versionId={} lenderIndex={} lenderId={} url={} err={}",
                        agreementId, versionId, i, res.lenderId(), url, e.getMessage(), e);
            }
        }
    }

    /**
     * Robust name extraction with fallbacks.
     * Supports typical extraction shapes without blowing up.
     */
    private String extractLenderName(JsonNode lenderPayload) {
        if (lenderPayload == null || lenderPayload.isNull()) return null;

        // Your current shape: name.value
        String v1 = lenderPayload.path("name").path("value").asText(null);
        if (v1 != null && !v1.isBlank()) return v1;

        // Fallbacks (depending on extract prompt evolution)
        String v2 = lenderPayload.path("lenderName").path("value").asText(null);
        if (v2 != null && !v2.isBlank()) return v2;

        String v3 = lenderPayload.path("lender").path("value").asText(null);
        if (v3 != null && !v3.isBlank()) return v3;

        // Sometimes name might be a plain string
        String v4 = lenderPayload.path("name").asText(null);
        if (v4 != null && !v4.isBlank()) return v4;

        return null;
    }
}
