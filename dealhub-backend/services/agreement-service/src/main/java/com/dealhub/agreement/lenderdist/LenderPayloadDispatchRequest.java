package com.dealhub.agreement.lenderdist;

import com.fasterxml.jackson.databind.JsonNode;

public record LenderPayloadDispatchRequest(
        String dealName,
        Long lenderId,
        String recipientEmail,
        JsonNode payload
) {}
