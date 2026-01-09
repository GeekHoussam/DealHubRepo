package com.dealhub.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthGlobalFilter.class);

    private static final String BEARER_PREFIX = "Bearer ";

    /**
     * Everything accessible without JWT.
     * Add openapi endpoints here when you proxy them via gateway swagger aggregator.
     *
     * NOTE:
     * Use prefix matching safely: we treat these as "path prefixes".
     * Do NOT include "/" at the end unless you want strict behavior.
     */
    private static final List<String> PUBLIC_PREFIXES = List.of(
            // Auth endpoints
            "/auth",

            // Swagger UI + assets
            "/swagger-ui",
            "/swagger-ui.html",
            "/webjars",

            // Generic openapi
            "/v3/api-docs",

            // Proxied openapi docs (gateway swagger aggregator)
            "/iam/v3/api-docs",
            "/agreement/v3/api-docs",
            "/document/v3/api-docs",
            "/extraction/v3/api-docs",
            "/borrower/v3/api-docs",
            "/notification/v3/api-docs",
            "/lender-mock/v3/api-docs"
    );

    private final SecretKey signingKey;

    // ✅ Used to allow internal system POST without JWT (optional but requested)
    private final String internalKey;

    public JwtAuthGlobalFilter(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${app.internal.key:dealhub-internal}") String internalKey
    ) {
        if (!StringUtils.hasText(jwtSecret) || jwtSecret.trim().length() < 32) {
            throw new IllegalArgumentException("jwt.secret must be set and at least 32 characters long");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.trim().getBytes(StandardCharsets.UTF_8));
        this.internalKey = internalKey;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        final String path = exchange.getRequest().getURI().getPath();
        final HttpMethod method = exchange.getRequest().getMethod();

        // 1) Allow CORS preflight
        if (method == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        // 2) ✅ Allow internal lender inbox POST via X-INTERNAL-KEY (no JWT)
        // This is useful for your "dispatch payload to lender inbox" system flow.
        // - Only POST /lender-payloads/inbox is allowed by internal key
        // - Everything else still requires JWT
        if (method == HttpMethod.POST && "/lender-payloads/inbox".equals(path)) {
            String key = exchange.getRequest().getHeaders().getFirst("X-INTERNAL-KEY");
            if (StringUtils.hasText(key) && key.equals(internalKey)) {
                return chain.filter(exchange);
            }
            // If internal key is missing/invalid, do NOT allow anonymous access
            // (Require JWT instead)
        }

        // 3) Allow public endpoints (Swagger, OpenAPI, Auth)
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // 4) Extract Bearer token
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith(BEARER_PREFIX)) {
            return unauthorized(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (!StringUtils.hasText(token)) {
            return unauthorized(exchange, "Empty Bearer token");
        }

        // 5) Validate JWT and extract claims
        Claims claims;
        try {
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);

            claims = jws.getPayload();
        } catch (JwtException ex) {
            log.warn("JWT rejected for path={} reason={}", path, ex.getMessage());
            return unauthorized(exchange, "Invalid or expired token");
        } catch (Exception ex) {
            log.error("Unexpected JWT validation error for path={}", path, ex);
            return serverError(exchange, "JWT validation error");
        }

        // 6) Forward claims to downstream services as headers
        String userId = stringClaim(claims, "sub");
        String email = stringClaim(claims, "email");
        String role = stringClaim(claims, "role");
        String lenderId = stringClaim(claims, "lenderId"); // MUST forward if present

        ServerWebExchange mutated = exchange.mutate()
                .request(r -> {
                    if (StringUtils.hasText(userId)) r.header("X-User-Id", userId);
                    if (StringUtils.hasText(email)) r.header("X-User-Email", email);
                    if (StringUtils.hasText(role)) r.header("X-User-Role", role);
                    if (StringUtils.hasText(lenderId)) r.header("X-Lender-Id", lenderId);
                })
                .build();

        return chain.filter(mutated);
    }

    private boolean isPublicPath(String path) {
        if (!StringUtils.hasText(path)) return true;

        String p = path.trim();
        if (!p.startsWith("/")) p = "/" + p;

        for (String prefix : PUBLIC_PREFIXES) {
            if (!StringUtils.hasText(prefix)) continue;

            String pr = prefix.trim();
            if (!pr.startsWith("/")) pr = "/" + pr;

            // ✅ treat prefix as a path segment prefix:
            // allow:
            //  - exact match: /swagger-ui
            //  - child paths: /swagger-ui/...
            // do NOT allow: /swagger-uix (accidental)
            if (p.equals(pr) || p.startsWith(pr + "/")) {
                return true;
            }
        }
        return false;
    }

    private String stringClaim(Claims claims, String name) {
        if (claims == null || !StringUtils.hasText(name)) return null;

        if ("sub".equalsIgnoreCase(name)) {
            return claims.getSubject();
        }

        Object v = claims.get(name);
        return v == null ? null : String.valueOf(v);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        return writeJson(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }

    private Mono<Void> serverError(ServerWebExchange exchange, String message) {
        return writeJson(exchange, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", message);
    }

    private Mono<Void> writeJson(ServerWebExchange exchange,
                                 HttpStatus status,
                                 String error,
                                 String message) {

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"error\":\"" + escapeJson(error) + "\",\"message\":\"" + escapeJson(message) + "\"}";
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
        );
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @Override
    public int getOrder() {
        return -1; // run early
    }
}
