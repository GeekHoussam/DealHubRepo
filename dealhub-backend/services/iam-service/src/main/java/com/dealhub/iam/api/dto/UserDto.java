package com.dealhub.iam.api.dto;

public record UserDto(
        Long id,
        String email,
        String role,
        Long lenderId,
        boolean enabled
) {}
