package com.dealhub.borrowerservice.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Component
public class CurrentAgent {

    private final HttpServletRequest request;

    public CurrentAgent(HttpServletRequest request) {
        this.request = request;
    }

    public Long requireAgentId() {
        String userId = request.getHeader("X-User-Id");

        if (!StringUtils.hasText(userId)) {
            throw new ResponseStatusException(UNAUTHORIZED, "Missing X-User-Id header (gateway auth required)");
        }

        try {
            return Long.parseLong(userId.trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid X-User-Id header");
        }
    }
}
