package com.dealhub.agreement.agreement;

import com.dealhub.agreement.lenderdist.LenderDistributionService;
import com.dealhub.agreement.version.AgreementStatus;
import com.dealhub.agreement.version.AgreementVersion;
import com.dealhub.agreement.version.AgreementVersionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AgreementService {

    private static final Logger log = LoggerFactory.getLogger(AgreementService.class);

    private final AgreementRepository agreementRepo;
    private final AgreementVersionRepository versionRepo;
    private final AgreementParticipantRepository participantRepo;

    private final RestClient rest;

    // ✅ NEW: lender-mock distribution (expected lender payload)
    private final LenderDistributionService lenderDistributionService;

    // Call notification-service through gateway (recommended)
    @Value("${app.notification.base-url:http://localhost:8080}")
    private String notificationBaseUrl;

    // Simple internal key for demo (same as IAM internal key)
    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public AgreementService(
            AgreementRepository agreementRepo,
            AgreementVersionRepository versionRepo,
            AgreementParticipantRepository participantRepo,
            LenderDistributionService lenderDistributionService,
            RestClient.Builder restClientBuilder
    ) {
        this.agreementRepo = agreementRepo;
        this.versionRepo = versionRepo;
        this.participantRepo = participantRepo;
        this.lenderDistributionService = lenderDistributionService;
        this.rest = restClientBuilder.build();
    }

    /* -----------------------------
       Agreement
    ----------------------------- */

    public Agreement createAgreement(String name, String borrower, String agent) {
        return agreementRepo.save(new Agreement(name, borrower, agent));
    }

    /* -----------------------------
       Versions
    ----------------------------- */

    @Transactional
    public AgreementVersion createDraft(Long agreementId, JsonNode extractedJson) {
        if (extractedJson == null || extractedJson.isNull()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "extracted JSON is required");
        }

        agreementRepo.findById(agreementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agreement not found"));

        AgreementVersion v = new AgreementVersion();
        v.setAgreementId(agreementId);
        v.setStatus(AgreementStatus.DRAFT);
        v.setExtractedJson(extractedJson);
        v.setCreatedAt(Instant.now());

        return versionRepo.save(v);
    }

    @Transactional(readOnly = true)
    public AgreementVersion getVersionById(Long versionId) {
        return versionRepo.findById(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version not found"));
    }

    @Transactional
    public AgreementVersion updateDraft(Long versionId, JsonNode extractedJson, Long userId) {
        if (extractedJson == null || extractedJson.isNull()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "extracted JSON is required");
        }

        AgreementVersion v = versionRepo.findById(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version not found"));

        if (v.getStatus() != AgreementStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only DRAFT versions can be updated");
        }

        v.setExtractedJson(extractedJson);
        return versionRepo.save(v);
    }

    @Transactional
    public AgreementVersion validateVersion(Long versionId, Long validatedByUserId) {
        AgreementVersion v = versionRepo.findById(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version not found"));

        if (v.getStatus() != AgreementStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only DRAFT versions can be validated");
        }

        v.validate(validatedByUserId);
        return versionRepo.save(v);
    }

    /**
     * ✅ Publish:
     * - publish version
     * - distribute lender-specific expected payloads to lender-mock (non-blocking)
     * - notify notification-service (non-blocking)
     */
    @Transactional
    public AgreementVersion publishVersion(Long versionId, Long userId) {

        AgreementVersion v = versionRepo.findById(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version not found"));

        try {
            v.publish(userId);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        // ✅ Save published version first (source of truth)
        AgreementVersion published = versionRepo.save(v);

        Long agreementId = published.getAgreementId();

        // ✅ Load agreement (used for dealName)
        Agreement agreement = agreementRepo.findById(agreementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agreement not found"));

        String dealName = (agreement.getName() != null && !agreement.getName().isBlank())
                ? agreement.getName()
                : "Facility Agreement";

        // =========================================================
        // ✅ 1) LENDER-SPECIFIC DISTRIBUTION (non-blocking)
        // =========================================================
        try {
            lenderDistributionService.sendToAllLenders(
                    agreementId,
                    dealName,
                    published.getExtractedJson()
            );

            log.info("[LENDER-DIST] done agreementId={} versionId={}", agreementId, published.getId());

        } catch (Exception e) {
            // do not break publish flow
            log.warn("[LENDER-DIST] Failed distribution on publish versionId={}: {}", versionId, e.getMessage(), e);
        }

        // =========================================================
        // ✅ 2) NOTIFICATION SERVICE (non-blocking) - keep your logic
        // =========================================================
        try {
            List<Long> lenderIds = participantRepo.findDistinctLenderIdsByAgreementId(agreementId);

            if (lenderIds != null && !lenderIds.isEmpty()) {

                Map<String, Object> payload = new HashMap<>();
                payload.put("agreementId", agreementId);
                payload.put("versionId", published.getId());
                payload.put("agreementName", dealName);
                payload.put("lenderIds", lenderIds);
                payload.put("extractedJson", published.getExtractedJson());

                rest.post()
                        .uri(notificationBaseUrl + "/notifications/published")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-INTERNAL-KEY", internalKey)
                        .body(payload)
                        .retrieve()
                        .toBodilessEntity();

                log.info("[NOTIFY] published agreementId={} versionId={} lenders={}",
                        agreementId, published.getId(), lenderIds.size());
            } else {
                log.info("[NOTIFY] No participants found for agreementId={}, skipping notify", agreementId);
            }

        } catch (Exception e) {
            // IMPORTANT: do not break publish flow in demo
            log.warn("[NOTIFY] Failed to notify on publish versionId={}: {}", versionId, e.getMessage(), e);
        }

        return published;
    }
}
