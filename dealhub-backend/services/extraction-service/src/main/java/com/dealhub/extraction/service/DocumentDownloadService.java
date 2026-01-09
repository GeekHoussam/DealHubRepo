package com.dealhub.extraction.service;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;

@Service
public class DocumentDownloadService {

    private final WebClient webClient;

    public DocumentDownloadService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Path downloadToTempFile(Long documentId, String authorizationHeader) {
        try {
            Path tmp = Files.createTempFile("dealhub-doc-" + documentId + "-", ".pdf");

            webClient.get()
                    .uri("/documents/{id}/download", documentId)
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .retrieve()
                    .bodyToFlux(DataBuffer.class)
                    .as(data -> DataBufferUtils.write(data, tmp, StandardOpenOption.TRUNCATE_EXISTING))
                    .then()
                    .block();

            return tmp;
        } catch (IOException e) {
            throw new RuntimeException("Failed creating temp file for document " + documentId, e);
        }
    }

    public void safeDelete(Path path) {
        if (path == null) return;
        try {
            Files.deleteIfExists(path);
        } catch (Exception ignored) {}
    }
}
