// agreement-service
package com.dealhub.agreement.notification;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record PublishNotificationRequest(
        Long agreementId,
        Long versionId,
        String agreementName,
        JsonNode extractedJson,
        List<Long> lenderIds
) {}
