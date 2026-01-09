package com.dealhub.agreement.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record LenderInboxMessageDto(
        Long id,
        String dealName,
        Long lenderId,
        String recipientEmail,
        Instant createdAt,
        JsonNode payload
) {}
