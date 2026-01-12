package com.dealhub.agreement.agreement;

import com.dealhub.agreement.api.dto.AgreementRowDto;
import com.dealhub.agreement.security.AccessPolicy;
import com.dealhub.agreement.security.AuthenticatedUser;
import com.dealhub.agreement.version.AgreementVersion;
import com.dealhub.agreement.version.AgreementVersionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AgreementQueryService {

    private final AgreementRepository agreementRepo;
    private final AgreementVersionRepository versionRepo;
    private final AgreementParticipantRepository participantRepo;
    private final AccessPolicy policy;

    public AgreementQueryService(AgreementRepository agreementRepo,
                                 AgreementVersionRepository versionRepo,
                                 AgreementParticipantRepository participantRepo,
                                 AccessPolicy policy) {
        this.agreementRepo = agreementRepo;
        this.versionRepo = versionRepo;
        this.participantRepo = participantRepo;
        this.policy = policy;
    }

    public List<AgreementRowDto> listRecent(AuthenticatedUser user, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return list(user, since, null);
    }

    public List<AgreementRowDto> listHistorical(AuthenticatedUser user, String q) {
        return list(user, null, q);
    }

    private List<AgreementRowDto> list(AuthenticatedUser user, Instant since, String query) {

        List<Agreement> agreements;

        if (policy.isAdminOrAgent(user)) {
            agreements = (since != null) ? agreementRepo.findRecent(since) : agreementRepo.findAll();
        } else {
            if (!policy.isLender(user) || user.lenderId() == null) return List.of();
            agreements = agreementRepo.findByLender(user.lenderId());
        }

        if (agreements.isEmpty()) return List.of();

        if (query != null && !query.isBlank()) {
            String qq = query.toLowerCase();
            agreements = agreements.stream()
                    .filter(a ->
                            (a.getName() != null && a.getName().toLowerCase().contains(qq)) ||
                                    (a.getBorrower() != null && a.getBorrower().toLowerCase().contains(qq)) ||
                                    (a.getAgent() != null && a.getAgent().toLowerCase().contains(qq))
                    )
                    .toList();
        }

        if (agreements.isEmpty()) return List.of();

        // 3) Fetch latest versions + latest draft + latest validated
        List<Long> ids = agreements.stream().map(Agreement::getId).toList();

        List<AgreementVersion> latestVersions = versionRepo.findLatestForAgreements(ids);
        List<AgreementVersion> latestDrafts = versionRepo.findLatestDraftForAgreements(ids);
        List<AgreementVersion> latestValidated = versionRepo.findLatestValidatedForAgreements(ids);

        Map<Long, AgreementVersion> latestByAgreementId = new HashMap<>();
        for (AgreementVersion v : latestVersions) {
            latestByAgreementId.put(v.getAgreementId(), v);
        }

        Map<Long, AgreementVersion> latestDraftByAgreementId = new HashMap<>();
        for (AgreementVersion v : latestDrafts) {
            latestDraftByAgreementId.put(v.getAgreementId(), v);
        }

        Map<Long, AgreementVersion> latestValidatedByAgreementId = new HashMap<>();
        for (AgreementVersion v : latestValidated) {
            latestValidatedByAgreementId.put(v.getAgreementId(), v);
        }

        List<AgreementRowDto> rows = new ArrayList<>();

        for (Agreement a : agreements) {
            AgreementVersion latest = latestByAgreementId.get(a.getId());
            if (latest == null) continue;

            AgreementVersion latestDraft = latestDraftByAgreementId.get(a.getId());
            AgreementVersion latestValidatedVersion = latestValidatedByAgreementId.get(a.getId());

            if (policy.isLender(user)) {
                if (latestValidatedVersion == null) continue;
                latest = latestValidatedVersion; // show validated snapshot
            } else {

                if (latestDraft != null) {
                    latest = latestDraft;
                }
            }

            Instant lastUpdated = latest.getCreatedAt();
            if (since != null && lastUpdated.isBefore(since)) continue;

            int facilitiesCount = 0;
            String totalAmount = "";

            rows.add(new AgreementRowDto(
                    a.getId(),
                    a.getName(),
                    a.getBorrower(),
                    a.getAgent(),
                    facilitiesCount,
                    totalAmount,
                    latest.getStatus(),
                    lastUpdated,
                    latest.getValidatedAt(),
                    latestByAgreementId.get(a.getId()) != null ? latestByAgreementId.get(a.getId()).getId() : null,
                    latestDraft != null ? latestDraft.getId() : null,
                    latestValidatedVersion != null ? latestValidatedVersion.getId() : null
            ));
        }

        rows.sort(Comparator.comparing(AgreementRowDto::lastUpdated).reversed());
        return rows;
    }
}
