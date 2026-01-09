package com.dealhub.agreement.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class SecurityDebugLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(SecurityDebugLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.debug("[SECURITY] chain=agreement method={} path={} auth={}",
                request.getMethod(), request.getRequestURI(), summarize(auth));
        filterChain.doFilter(request, response);
    }

    private String summarize(Authentication auth) {
        if (auth == null) {
            return "null";
        }
        return auth.getClass().getSimpleName() + "{principal=" + auth.getPrincipal()
                + ", authorities=" + auth.getAuthorities() + "}";
    }
}
