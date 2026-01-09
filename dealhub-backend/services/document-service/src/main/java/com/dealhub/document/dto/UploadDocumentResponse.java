package com.dealhub.document.dto;

public record UploadDocumentResponse(
        Long id,
        Long agreementId,
        String message
) {}