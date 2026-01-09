package com.dealhub.notification.service;

import com.dealhub.notification.api.dto.PublishNotifyRequest;
import com.dealhub.notification.model.NotificationEntity;
import com.dealhub.notification.model.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repo;
    private final RestClient rest;

    @Value("${app.notifications.mode:mock}")
    private String mode;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.iam.base-url:http://localhost:8080}")
    private String iamBaseUrl;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
        this.rest = RestClient.builder().build();
    }

    public void onDealPublished(PublishNotifyRequest req) {
        for (Long lenderId : req.lenderIds()) {

            // 1) persist notification
            NotificationEntity n = repo.save(NotificationEntity.builder()
                    .lenderId(lenderId)
                    .agreementId(req.agreementId())
                    .versionId(req.versionId())
                    .type("DEAL_PUBLISHED")
                    .status("CREATED")
                    .build());

            // 2) resolve recipient emails from IAM internal
            List<String> emails = fetchLenderEmails(lenderId);

            // 3) build lender access link (simple)
            // lender will login with JWT then open detail view
            String link = frontendBaseUrl + "/agreements/versions/" + req.versionId();

            // 4) MOCK email (log)
            if ("mock".equalsIgnoreCase(mode)) {
                log.info("📧 [MOCK EMAIL] To={} | lenderId={} | agreementId={} | versionId={} | link={}",
                        emails, lenderId, req.agreementId(), req.versionId(), link);
            } else {
                // later: real SMTP
                log.warn("Email mode is not mock, but SMTP sending not implemented yet.");
            }

            // 5) mark sent
            n.setStatus("SENT");
            repo.save(n);
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> fetchLenderEmails(Long lenderId) {
        try {
            Object body = rest.get()
                    .uri(iamBaseUrl + "/internal/lenders/" + lenderId + "/emails")
                    .header("X-INTERNAL-KEY", internalKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(Object.class);

            if (body instanceof List<?> list) {
                return list.stream().map(String::valueOf).toList();
            }
            return List.of();
        } catch (Exception e) {
            log.warn("Failed to resolve lender emails for lenderId={}: {}", lenderId, e.getMessage());
            return List.of();
        }
    }

}
