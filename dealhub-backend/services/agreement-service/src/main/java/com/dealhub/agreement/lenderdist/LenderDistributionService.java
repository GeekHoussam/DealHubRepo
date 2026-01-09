package com.dealhub.agreement.lenderdist;

import com.dealhub.agreement.agreement.AgreementParticipantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class LenderDistributionService {

    private final RestClient rest;
    private final ObjectMapper mapper;
    private final AgreementParticipantRepository participantRepo;
    private final LenderPayloadViewMapper viewMapper;

    /**
     * IMPORTANT:
     * - If you call lender-mock via gateway => use http://localhost:8080
     * - If you call lender-mock directly => use http://localhost:8090
     *
     * Your lender-mock controller requires X-INTERNAL-KEY header.
     */
    @Value("${app.lendermock.base-url:http://localhost:8080}") // via gateway by default
    private String lenderMockBaseUrl;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public LenderDistributionService(
            RestClient.Builder builder,
            ObjectMapper mapper,
            AgreementParticipantRepository participantRepo,
            LenderPayloadViewMapper viewMapper
    ) {
        this.rest = builder.build();
        this.mapper = mapper;
        this.participantRepo = participantRepo;
        this.viewMapper = viewMapper;
    }

    /**
     * Call this AFTER publish succeeds.
     *
     * Steps:
     * 1) Load all lenderIds participating in the agreement
     * 2) Build lender-specific "expected payload" (small JSON) for each lender
     * 3) POST it to lender-mock inbox endpoint
     */
    public void sendToAllLenders(Long agreementId, String dealName, JsonNode extractedJson) {

        if (agreementId == null) {
            throw new IllegalArgumentException("agreementId is required");
        }
        if (extractedJson == null || extractedJson.isNull()) {
            throw new IllegalArgumentException("extractedJson is required");
        }

        String effectiveDealName = StringUtils.hasText(dealName) ? dealName : "Facility Agreement";

        List<Long> lenderIds = participantRepo.findDistinctLenderIdsByAgreementId(agreementId);
        if (lenderIds == null || lenderIds.isEmpty()) return;

        for (Long lenderId : lenderIds) {
            if (lenderId == null) continue;

            // ✅ demo mapping: replace later with IAM lookup if needed
            String recipientEmail = emailFromLenderIdOrConvention(lenderId);

            // ✅ Build expected lender payload (small JSON)
            ObjectNode expectedPayload = viewMapper.buildLenderView(
                    extractedJson,
                    recipientEmail,
                    effectiveDealName
            );

            // ✅ Envelope sent to lender-mock
            ObjectNode req = mapper.createObjectNode();
            req.put("dealName", effectiveDealName);
            req.put("lenderId", lenderId);
            req.put("recipientEmail", recipientEmail);
            req.set("payload", expectedPayload);

            rest.post()
                    // If baseUrl is gateway: /lender-payloads/inbox (gateway route 15)
                    // If baseUrl is lender-mock direct: /lender-payloads/inbox (same)
                    .uri(lenderMockBaseUrl + "/lender-payloads/inbox")
                    .header("X-INTERNAL-KEY", internalKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .toBodilessEntity();
        }
    }

    /**
     * Demo-only mapping (lenderId -> email).
     * Replace later with:
     * - lender table
     * - IAM internal endpoint
     */
    private String emailFromLenderIdOrConvention(Long lenderId) {
        if (lenderId == 11L) return "bnp.paribas@dealhub.com";
        if (lenderId == 12L) return "danske.bank@dealhub.com";
        if (lenderId == 13L) return "seb@dealhub.com";
        return "lender" + lenderId + "@dealhub.com";
    }
}
