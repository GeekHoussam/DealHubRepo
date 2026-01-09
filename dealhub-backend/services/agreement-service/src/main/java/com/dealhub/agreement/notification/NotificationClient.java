package com.dealhub.agreement.notification;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class NotificationClient {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String NOTIFICATION_URL =
            "http://localhost:8085/notifications/publish";

    public void notifyPublish(PublishNotificationRequest req) {
        restTemplate.postForEntity(NOTIFICATION_URL, req, Void.class);
    }
}
