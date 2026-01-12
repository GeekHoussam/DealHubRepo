package com.dealhub.agreement.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LenderInboxMessageRawDto(
        Long id,
        @JsonProperty("dealName") String dealName,
        @JsonProperty("lenderId") Long lenderId,
        @JsonProperty("recipientEmail") String recipientEmail,
        @JsonProperty("createdAt") String createdAt,
        @JsonProperty("payload") String payload
) {}