package com.dealhub.document.integration.dto;

public record CreateAgreementResponse(
        Long id,
        String name,
        String borrower,
        String agent
) {}
