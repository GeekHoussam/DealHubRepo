package com.dealhub.extraction.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@Component
public class DocumentClient {

    private final WebClient webClient;

    public DocumentClient(@Qualifier("dealhubGatewayWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public Flux<DataBuffer> download(Long documentId, String authorizationHeader) {
        return webClient.get()
                .uri("/documents/{id}/download", documentId)
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .retrieve()
                .bodyToFlux(DataBuffer.class); // ✅ streaming
    }
}
