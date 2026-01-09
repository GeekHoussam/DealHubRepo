package com.dealhub.agreement.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AccessPolicy {

    private String norm(String role) {
        if (role == null) return "";
        String r = role.trim().toUpperCase();
        if (r.startsWith("ROLE_")) r = r.substring("ROLE_".length());
        return r;
    }

    public boolean isAdminOrAgent(AuthenticatedUser u) {
        String r = norm(u.role());
        return "ADMIN".equals(r) || "AGENT".equals(r);
    }

    public boolean isLender(AuthenticatedUser u) {
        return "LENDER".equals(norm(u.role()));
    }

    public void requireAdminOrAgent(AuthenticatedUser u) {
        if (!isAdminOrAgent(u)) {
            throw new AccessDeniedException("Forbidden for role=" + u.role());
        }
    }
    public void requireLender(AuthenticatedUser u) {
        if (u == null || u.role() == null || !u.role().equals("LENDER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "LENDER role required");
        }
    }
}
