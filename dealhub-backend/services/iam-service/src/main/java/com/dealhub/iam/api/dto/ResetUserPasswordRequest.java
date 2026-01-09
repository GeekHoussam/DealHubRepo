package com.dealhub.iam.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetUserPasswordRequest(
        @NotBlank String password
) {}
