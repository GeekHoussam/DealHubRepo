package com.dealhub.iam.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotNull String role,
        Long lenderId
) {}
