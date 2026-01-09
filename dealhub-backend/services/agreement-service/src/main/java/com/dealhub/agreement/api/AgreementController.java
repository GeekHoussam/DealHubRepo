package com.dealhub.agreement.api;

import com.dealhub.agreement.agreement.Agreement;
import com.dealhub.agreement.agreement.AgreementParticipant;
import com.dealhub.agreement.agreement.AgreementParticipantRepository;
import com.dealhub.agreement.agreement.AgreementQueryService;
import com.dealhub.agreement.agreement.AgreementService;
import com.dealhub.agreement.api.dto.AddParticipantRequest;
import com.dealhub.agreement.api.dto.AgreementRowDto;
import com.dealhub.agreement.api.dto.CreateAgreementRequest;
import com.dealhub.agreement.api.dto.LenderInboxMessageDto;
import com.dealhub.agreement.lenderdist.LenderInboxClient;
import com.dealhub.agreement.security.AccessPolicy;
import com.dealhub.agreement.security.AuthenticatedUser;
import com.dealhub.agreement.version.AgreementVersion;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.dealhub.agreement.lenderdist.LenderPayloadViewMapper;

import java.util.List;

@RestController
@RequestMapping("/agreements")
public class AgreementController {

    private static final Logger log = LoggerFactory.getLogger(AgreementController.class);

    private final AgreementService agreementService;
    private final AgreementQueryService queryService;
    private final AgreementParticipantRepository participantRepo;
    private final AccessPolicy policy;
    private final LenderInboxClient lenderInboxClient;
    private final LenderPayloadViewMapper lenderPayloadViewMapper;

    public AgreementController(
            AgreementService agreementService,
            AgreementQueryService queryService,
            AgreementParticipantRepository participantRepo,
            AccessPolicy policy,
            LenderInboxClient lenderInboxClient,
            LenderPayloadViewMapper lenderPayloadViewMapper
    ) {
        this.agreementService = agreementService;
        this.queryService = queryService;
        this.participantRepo = participantRepo;
        this.policy = policy;
        this.lenderInboxClient = lenderInboxClient;
        this.lenderPayloadViewMapper = lenderPayloadViewMapper;
    }

    private AuthenticatedUser me(AuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing auth");
        }
        return user;
    }

    @Operation(summary = "Dashboard recent agreements")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @GetMapping("/recent")
    public List<AgreementRowDto> recent(
            @RequestParam(defaultValue = "14") int days,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return queryService.listRecent(me(user), days);
    }

    @Operation(summary = "Dashboard historical agreements", description = "Optional query search on name/borrower")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @GetMapping("/historical")
    public List<AgreementRowDto> historical(
            @RequestParam(defaultValue = "") String q,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return queryService.listHistorical(me(user), q);
    }

    @Operation(summary = "Create agreement", description = "Admin/Agent only")
    @ApiResponse(responseCode = "200", description = "Agreement created")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @PostMapping
    public Agreement create(
            @Valid @RequestBody CreateAgreementRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);
        return agreementService.createAgreement(req.name(), req.borrower(), req.agent());
    }

    @Operation(summary = "Add agreement participant", description = "Admin/Agent only")
    @ApiResponse(responseCode = "201", description = "Participant added")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @PostMapping("/{agreementId}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    public void addParticipant(
            @PathVariable Long agreementId,
            @Valid @RequestBody AddParticipantRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);
        participantRepo.save(new AgreementParticipant(agreementId, req.lenderId()));
    }

    @Operation(
            summary = "Create draft version from extraction output",
            description = "Admin/Agent only. Accepts ANY JSON and stores it as a draft version."
    )
    @ApiResponse(responseCode = "200", description = "Draft created")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Agreement not found")
    @PostMapping("/{agreementId}/versions/draft")
    public AgreementVersion createDraft(
            @PathVariable Long agreementId,
            @RequestBody JsonNode extracted,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        log.debug("[AGREEMENT] createDraft entry agreementId={}", agreementId);
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);

        // ✅ store JSON as JSON (no stringification)
        return agreementService.createDraft(agreementId, extracted);
    }

    @Operation(summary = "Validate agreement version", description = "Admin/Agent only")
    @ApiResponse(responseCode = "200", description = "Validated")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @PostMapping("/versions/{versionId}/validate")
    public AgreementVersion validate(
            @PathVariable Long versionId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);
        return agreementService.validateVersion(versionId, u.userId());
    }

    @PostMapping("/versions/{versionId}/publish")
    public AgreementVersion publish(
            @PathVariable Long versionId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        log.info("PUBLISH HIT versionId={}, principal={}", versionId, user);
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);
        return agreementService.publishVersion(versionId, u.userId());
    }

    @PatchMapping("/versions/{versionId}")
    public AgreementVersion updateDraft(
            @PathVariable Long versionId,
            @RequestBody JsonNode extractedJson,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);
        return agreementService.updateDraft(versionId, extractedJson, u.userId());
    }

    @GetMapping("/versions/{versionId}")
    public AgreementVersion getVersion(
            @PathVariable Long versionId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        AuthenticatedUser u = me(user);
        policy.requireAdminOrAgent(u);
        return agreementService.getVersionById(versionId);
    }

    // =========================================
    // ✅ LENDER INBOX (LENDER only)
    // =========================================
    @Operation(summary = "Lender inbox (my received payloads)", description = "LENDER only")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @GetMapping("/lender/inbox")
    public List<LenderInboxMessageDto> myInbox(@AuthenticationPrincipal AuthenticatedUser user) {
        AuthenticatedUser u = me(user);
        policy.requireLender(u);

        Long lenderId = u.lenderId();
        if (lenderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing lenderId in token/profile");
        }

        String lenderEmail = u.email();

        List<LenderInboxMessageDto> messages = lenderInboxClient.getInboxForLender(lenderId);

        return messages.stream()
                .map(m -> new LenderInboxMessageDto(
                        m.id(),
                        m.dealName(),
                        m.lenderId(),
                        m.recipientEmail(),
                        m.createdAt(),
                        lenderPayloadViewMapper.buildLenderView(
                                m.payload() == null ? com.fasterxml.jackson.databind.node.NullNode.instance : m.payload(),
                                lenderEmail,
                                m.dealName()
                        )
                ))
                .toList();
    }


}
