package com.dealhub.agreement.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CreateDraftRequest", description = "Payload produced by extraction service.")
public record CreateDraftRequest(
        @Schema(
                description = "The extracted JSON (stringified JSON) to store as a draft version",
                example = "{\"source\":\"extraction-service\",\"documentId\":\"doc-123\",\"borrower\":{\"name\":\"Acme\"}}"
        )
        String extractedJson
) {}
