package com.dealhub.agreement.api.dto;

import jakarta.validation.constraints.NotNull;

public record AddParticipantRequest(
        @NotNull Long lenderId
) {}
