package com.dealhub.document.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // For microservices behind a gateway, disable CSRF for APIs
        http.csrf(csrf -> csrf.disable());

        // Allow OpenAPI + Swagger UI publicly
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                ).permitAll()
                // Gateway already validates JWT; keep service open (recommended in your architecture)
                .anyRequest().permitAll()
        );

        // Disable default login page prompts; keep basic disabled or default, up to you
        http.httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
