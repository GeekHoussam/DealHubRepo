package com.dealhub.extraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class AgreementClient {

    private final WebClient webClient;

    public AgreementClient(
            WebClient.Builder builder,
            @Value("${dealhub.gateway.base-url}") String gatewayBaseUrl
    ) {
        this.webClient = builder.baseUrl(gatewayBaseUrl).build();
    }

    public void createDraft(Long agreementId, JsonNode extractedJson, String authorizationHeader) {
        webClient.post()
                .uri("/agreements/{agreementId}/versions/draft", agreementId)
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader == null ? "" : authorizationHeader)
                .bodyValue(extractedJson) // JsonNode -> proper JSON body
                .retrieve()
                .toBodilessEntity()
                .block();
    }
}
