package com.dealhub.document.integration;

import com.dealhub.document.integration.dto.CreateAgreementRequest;
import com.dealhub.document.integration.dto.CreateAgreementResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class AgreementGatewayClient {

    private final WebClient webClient;
    private final String gatewayBaseUrl;

    public AgreementGatewayClient(WebClient webClient,
                                  @Value("${app.gateway.base-url:http://localhost:8080}") String gatewayBaseUrl) {
        this.webClient = webClient;
        this.gatewayBaseUrl = gatewayBaseUrl;
    }

    public Mono<CreateAgreementResponse> createAgreement(CreateAgreementRequest req, String authorization) {
        return webClient.post()
                .uri(gatewayBaseUrl + "/agreements")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, authorization == null ? "" : authorization)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(CreateAgreementResponse.class);
    }
}
