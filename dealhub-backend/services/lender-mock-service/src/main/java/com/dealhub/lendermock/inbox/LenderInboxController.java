package com.dealhub.lendermock.inbox;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/lender-payloads")
public class LenderInboxController {

    private static final Logger log = LoggerFactory.getLogger(LenderInboxController.class);

    private final InboxMessageRepository repo;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public LenderInboxController(InboxMessageRepository repo) {
        this.repo = repo;
    }

    private void requireInternalKey(HttpServletRequest request) {
        String key = request.getHeader("X-INTERNAL-KEY");
        if (key == null || !key.equals(internalKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing/invalid X-INTERNAL-KEY");
        }
    }

    @PostMapping("/inbox")
    @ResponseStatus(HttpStatus.CREATED)
    public void inbox(
            @Parameter(description = "Internal system key (required)", required = true)
            @RequestHeader("X-INTERNAL-KEY") String internalKeyHeader,
            @RequestBody LenderPayloadDispatchRequest req,
            HttpServletRequest request
    ) {
        // We keep your existing enforcement logic (source of truth)
        requireInternalKey(request);

        if (req.lenderId() == null || req.recipientEmail() == null || req.payload() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lenderId, recipientEmail, payload are required");
        }

        repo.save(new InboxMessageEntity(
                req.dealName(),
                req.lenderId(),
                req.recipientEmail(),
                req.payload().toString() // ✅ JsonNode → String
        ));

        log.info("[LENDER-INBOX] received dealName={} lenderId={} email={}",
                req.dealName(), req.lenderId(), req.recipientEmail());
    }

    @GetMapping("/inbox/{lenderId}")
    public List<InboxMessageEntity> getInbox(@PathVariable Long lenderId) {
        return repo.findTop50ByLenderIdOrderByCreatedAtDesc(lenderId);
    }
}
