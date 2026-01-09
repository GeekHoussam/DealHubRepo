package com.dealhub.extraction.dto;

public record ExtractionTriggerResponse(
        String extractionId,
        String status,
        String message
) {}
