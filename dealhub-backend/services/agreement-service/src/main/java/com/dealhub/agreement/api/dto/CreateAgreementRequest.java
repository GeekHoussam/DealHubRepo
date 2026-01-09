package com.dealhub.agreement.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAgreementRequest(
        @NotBlank String name,
        @NotBlank String borrower,
        @NotBlank String agent
) {}
