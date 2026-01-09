package com.dealhub.borrowerservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBorrowerRequest(
        @NotBlank(message = "name is required")
        @Size(max = 200, message = "name must be <= 200 chars")
        String name
) {}
