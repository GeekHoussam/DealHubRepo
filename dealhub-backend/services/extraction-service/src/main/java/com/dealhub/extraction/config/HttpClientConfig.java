package com.dealhub.extraction.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class HttpClientConfig {

    @Bean
    public WebClient webClient(@Value("${app.gateway.base-url:http://localhost:8080}") String gatewayBaseUrl) {
        return WebClient.builder().baseUrl(gatewayBaseUrl).build();
    }
}
