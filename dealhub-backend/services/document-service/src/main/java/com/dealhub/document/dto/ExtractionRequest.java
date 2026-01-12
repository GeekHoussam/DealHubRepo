package com.dealhub.document.dto;

import jakarta.validation.constraints.NotNull;

public record ExtractionRequest(
        Long agreementId,
        @NotNull(message = "Extraction profile cannot be null")
        String extractionProfile
) {}
