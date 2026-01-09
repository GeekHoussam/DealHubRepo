package com.dealhub.iam.api.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserEnabledRequest(
        @NotNull Boolean enabled
) {}
