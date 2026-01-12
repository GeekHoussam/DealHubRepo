package com.dealhub.agreement.lenderdist;

import com.dealhub.agreement.agreement.Agreement;
import com.dealhub.agreement.agreement.AgreementRepository;
import com.dealhub.agreement.agreement.AgreementParticipantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Component
public class LenderPayloadDistributor {

    private static final Logger log = LoggerFactory.getLogger(LenderPayloadDistributor.class);

    private final AgreementParticipantRepository participantRepo;
    private final AgreementRepository agreementRepo;
    private final LenderPayloadViewMapper viewMapper;
    private final ObjectMapper mapper;
    private final RestClient rest;

    // go through gateway (recommended)
    @Value("${app.lendermock.base-url:http://localhost:8080}")
    private String lenderMockBaseUrl;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public LenderPayloadDistributor(
            AgreementParticipantRepository participantRepo,
            AgreementRepository agreementRepo,
            LenderPayloadViewMapper viewMapper,
            ObjectMapper mapper,
            RestClient.Builder builder
    ) {
        this.participantRepo = participantRepo;
        this.agreementRepo = agreementRepo;
        this.viewMapper = viewMapper;
        this.mapper = mapper;
        this.rest = builder.build();
    }

    /**
     * Strategy A:
     * On publish, compute lender view payload and send to lender-mock.
     * lender-mock stores expected payload only.
     */
    public void distributeLenderPayloads(Long agreementId, Long versionId, JsonNode extractedJson) {
        if (agreementId == null || extractedJson == null || extractedJson.isNull()) {
            return;
        }

        Agreement agreement = agreementRepo.findById(agreementId)
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Agreement not found"));

        String dealName = agreement.getName(); // "Demo Agreement" in your UI

        // all lenders linked to this agreement
        List<Long> lenderIds = participantRepo.findDistinctLenderIdsByAgreementId(agreementId);
        if (lenderIds == null || lenderIds.isEmpty()) {
            log.info("[LENDER-DIST] No participants for agreementId={}, skip", agreementId);
            return;
        }

        for (Long lenderId : lenderIds) {
            if (lenderId == null) continue;

            // Your demo convention (same you described)
            // lenderId=11 -> bnp.paribas@dealhub.com (if you want mapping by name, add lookup later)
            String recipientEmail = buildRecipientEmailForLender(lenderId);

            // ✅ build expected payload
            ObjectNode expectedPayload = viewMapper.buildLenderView(extractedJson, recipientEmail, "Facility Agreement");

            // ✅ POST to lender-mock inbox
            ObjectNode req = mapper.createObjectNode();
            req.put("dealName", dealName);
            req.put("lenderId", lenderId);
            req.put("recipientEmail", recipientEmail);
            req.set("payload", expectedPayload); // payload as JSON

            try {
                rest.post()
                        .uri(lenderMockBaseUrl + "/lender-payloads/inbox")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-INTERNAL-KEY", internalKey)
                        .body(req)
                        .retrieve()
                        .toBodilessEntity();

                log.info("[LENDER-DIST] sent agreementId={} versionId={} lenderId={} email={}",
                        agreementId, versionId, lenderId, recipientEmail);
            } catch (Exception e) {
                log.warn("[LENDER-DIST] failed lenderId={} agreementId={} : {}",
                        lenderId, agreementId, e.getMessage(), e);
            }
        }
    }

    /**
     * Demo mapping:
     * Replace this with DB lookup later (IAM/participants table).
     */
    private String buildRecipientEmailForLender(Long lenderId) {
        // ✅ for BNP demo:
        // if your BNP lenderId is fixed (ex: 11), you can hard-map it:
        if (lenderId == 11L) return "bnp.paribas@dealhub.com";

        // fallback demo email
        return "lender" + lenderId + "@dealhub.com";
    }
}
