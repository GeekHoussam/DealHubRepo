package com.dealhub.iam.api.dto;

public record MeResponse(
        Long id,
        String email,
        String role,
        Long lenderId
) {}
