package com.dealhub.document.util;

public final class AuthHeaderUtil {
    private AuthHeaderUtil() {}

    public static String normalizeBearer(String authorizationHeader) {
        if (authorizationHeader == null) return "";
        String h = authorizationHeader.trim();
        if (h.isBlank()) return "";
        return h.toLowerCase().startsWith("bearer ") ? h : "Bearer " + h;
    }
}
