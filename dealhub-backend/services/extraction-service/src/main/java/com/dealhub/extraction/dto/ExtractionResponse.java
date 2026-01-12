package com.dealhub.extraction.dto;

import com.dealhub.extraction.model.ExtractionProfile;
import com.dealhub.extraction.model.ExtractionStatus;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record ExtractionResponse(
        String jobKey,
        Long documentId,
        Long agreementId,
        ExtractionProfile extractionProfile,
        ExtractionStatus status,
        JsonNode resultJson,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {}
