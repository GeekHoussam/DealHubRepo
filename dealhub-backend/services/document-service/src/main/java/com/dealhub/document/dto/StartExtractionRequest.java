package com.dealhub.document.dto;

public record StartExtractionRequest(
        Long documentId,
        Long agreementId,
        String extractionProfile
) {}
