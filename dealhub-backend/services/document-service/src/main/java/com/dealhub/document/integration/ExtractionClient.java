package com.dealhub.document.integration;

import com.dealhub.document.dto.ExtractionTriggerResponse;
import com.dealhub.document.dto.StartExtractionRequest;
import com.dealhub.document.dto.ExtractionResponse; // New DTO to hold final extraction results
import com.dealhub.document.util.AuthHeaderUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class ExtractionClient {

    private final WebClient webClient;

    public ExtractionClient(WebClient.Builder builder,
                            @Value("${app.gateway.base-url:http://localhost:8080}") String gatewayBaseUrl) {
        this.webClient = builder
                .baseUrl(gatewayBaseUrl)
                .build();
    }

    /**
     * Starts an extraction job.
     */
    public Mono<ExtractionTriggerResponse> start(StartExtractionRequest req, String authorizationHeader) {
        String auth = AuthHeaderUtil.normalizeBearer(authorizationHeader);

        return webClient.post()
                .uri("/extractions/start")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .bodyValue(req)
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        resp -> resp.bodyToMono(String.class)
                                .defaultIfEmpty("No body")
                                .flatMap(body -> Mono.error(new RuntimeException(
                                        "Extraction start failed: HTTP " + resp.statusCode() + " body=" + body
                                ))))
                .bodyToMono(ExtractionTriggerResponse.class);
    }

    /**
     * Polls the extraction status by jobKey.
     * @param jobKey The jobKey of the extraction job to retrieve status.
     * @param authorizationHeader Optional authorization header for API access.
     * @return Final extraction result or error response.
     */
    public Mono<ExtractionResponse> pollExtraction(String jobKey, String authorizationHeader) {
        String auth = AuthHeaderUtil.normalizeBearer(authorizationHeader);

        return webClient.get()
                .uri("/extractions/" + jobKey)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        resp -> resp.bodyToMono(String.class)
                                .defaultIfEmpty("No body")
                                .flatMap(body -> Mono.error(new RuntimeException(
                                        "Failed to get extraction result: HTTP " + resp.statusCode() + " body=" + body
                                ))))
                .bodyToMono(ExtractionResponse.class);
    }
}
