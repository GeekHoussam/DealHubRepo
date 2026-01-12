package com.dealhub.agreement.api.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record LenderInboxMessageDto(
        Long id,
        String dealName,
        Long lenderId,
        String recipientEmail,
        String createdAt,
        JsonNode payload
) {}
