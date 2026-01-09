package com.dealhub.document.dto;

import java.time.Instant;

public record DocumentResponse(
        Long id,
        Long agreementId,
        String documentType,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        String sha256,
        Instant createdAt
) {}
