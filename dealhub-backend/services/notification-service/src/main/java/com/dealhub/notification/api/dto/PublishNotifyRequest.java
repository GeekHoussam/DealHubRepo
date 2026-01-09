package com.dealhub.notification.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PublishNotifyRequest(
        @NotNull Long agreementId,
        @NotNull Long versionId,
        String agreementName,
        @NotNull List<Long> lenderIds,
        JsonNode extractedJson
) {}
