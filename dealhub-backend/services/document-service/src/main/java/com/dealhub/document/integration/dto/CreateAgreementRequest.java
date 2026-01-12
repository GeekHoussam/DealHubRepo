package com.dealhub.document.integration.dto;

public record CreateAgreementRequest(
        String name,
        String borrower,
        String agent
) {}
