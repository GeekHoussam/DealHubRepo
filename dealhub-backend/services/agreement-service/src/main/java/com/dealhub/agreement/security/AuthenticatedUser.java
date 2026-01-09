package com.dealhub.agreement.security;

public record AuthenticatedUser(
        Long userId,
        String email,
        String role,
        Long lenderId
) {}