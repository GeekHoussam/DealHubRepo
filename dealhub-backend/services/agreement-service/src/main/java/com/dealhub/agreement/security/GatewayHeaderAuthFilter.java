package com.dealhub.agreement.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class GatewayHeaderAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(GatewayHeaderAuthFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Do not override existing authentication
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String userId = request.getHeader("X-User-Id");
        String roleHeader = request.getHeader("X-User-Role");
        String lenderId = request.getHeader("X-Lender-Id");
        String email = request.getHeader("X-User-Email");

        if (!StringUtils.hasText(userId)) {
            filterChain.doFilter(request, response);
            return;
        }

        Long uid = Long.valueOf(userId);
        Long lid = StringUtils.hasText(lenderId) ? Long.valueOf(lenderId) : null;

        String role = normalizeRole(roleHeader); // AGENT / ADMIN / LENDER

        var principal = new AuthenticatedUser(uid, email, role, lid);

        var authorities = role.isBlank()
                ? List.<SimpleGrantedAuthority>of()
                : List.of(new SimpleGrantedAuthority("ROLE_" + role));

        var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);

        log.info("[AGREEMENT] principal={}, authorities={}", principal, authorities);

        filterChain.doFilter(request, response);
    }

    private String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) return "";
        role = role.trim();
        if (role.startsWith("ROLE_")) role = role.substring(5);
        return role.toUpperCase();
    }

    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false; // ✅ run also on /error dispatch
    }
}
