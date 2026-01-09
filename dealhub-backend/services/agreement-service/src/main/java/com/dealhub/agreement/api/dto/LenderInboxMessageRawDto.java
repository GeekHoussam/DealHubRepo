package com.dealhub.agreement.api.dto;

import java.time.Instant;

public record LenderInboxMessageRawDto(
        Long id,
        String dealName,
        Long lenderId,
        String recipientEmail,
        Instant createdAt,
        String payload
) {}