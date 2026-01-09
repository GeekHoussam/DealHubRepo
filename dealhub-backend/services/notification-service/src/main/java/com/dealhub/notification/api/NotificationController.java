package com.dealhub.notification.api;

import com.dealhub.notification.api.dto.PublishNotifyRequest;
import com.dealhub.notification.model.NotificationRepository;
import com.dealhub.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService service;
    private final NotificationRepository repo;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public NotificationController(NotificationService service, NotificationRepository repo) {
        this.service = service;
        this.repo = repo;
    }

    @PostMapping("/published")
    public void notifyPublished(
            @RequestHeader(value = "X-INTERNAL-KEY", required = false) String key,
            @Valid @RequestBody PublishNotifyRequest req
    ) {
        if (key == null || !key.equals(internalKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal key");
        }
        service.onDealPublished(req);
    }

    // optional endpoint for lender dashboard (if you want)
    @GetMapping("/lender/{lenderId}")
    public List<?> listForLender(@PathVariable Long lenderId) {
        return repo.findByLenderIdOrderByCreatedAtDesc(lenderId);
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
