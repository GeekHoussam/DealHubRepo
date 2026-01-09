package com.dealhub.extraction.dto;

import com.dealhub.extraction.model.ExtractionProfile;
import jakarta.validation.constraints.NotNull;

public record StartExtractionRequest(
        @NotNull Long documentId,
        @NotNull Long agreementId,
        @NotNull ExtractionProfile extractionProfile
) {}
