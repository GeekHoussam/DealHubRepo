package com.dealhub.document.integration;

import com.dealhub.document.dto.ExtractionRequest;
import com.dealhub.document.dto.ExtractionTriggerResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class ExtractionGatewayClient {

    private final WebClient webClient;

    public ExtractionGatewayClient(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<ExtractionTriggerResponse> triggerExtraction(Long documentId,
                                                             ExtractionRequest request,
                                                             String authorizationHeader) {

        return webClient.post()
                .uri("/extractions/start")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader) // forward user token
                .bodyValue(new StartExtractionPayload(documentId, request.agreementId(), request.extractionProfile()))
                .retrieve()
                .bodyToMono(ExtractionTriggerResponse.class);
    }

    public record StartExtractionPayload(Long documentId, Long agreementId, String extractionProfile) {}
}
