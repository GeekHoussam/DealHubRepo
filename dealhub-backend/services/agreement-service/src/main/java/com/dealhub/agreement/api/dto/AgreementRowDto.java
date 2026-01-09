package com.dealhub.agreement.api.dto;

import com.dealhub.agreement.version.AgreementStatus;

import java.time.Instant;

public record AgreementRowDto(
        Long agreementId,
        String agreementName,
        String borrower,
        String agent,
        int facilitiesCount,
        String totalAmount,
        AgreementStatus status,
        Instant lastUpdated,
        Instant validatedAt,

        // ✅ NEW: ids needed for dashboard actions
        Long latestVersionId,
        Long latestDraftVersionId,
        Long latestValidatedVersionId
) {}
