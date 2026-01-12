package com.dealhub.extraction.service;

import com.dealhub.extraction.dto.ExtractionResponse;
import com.dealhub.extraction.dto.StartExtractionRequest;
import com.dealhub.extraction.model.ExtractionJobEntity;
import com.dealhub.extraction.model.ExtractionStatus;
import com.dealhub.extraction.repository.ExtractionJobRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.channels.AsynchronousFileChannel;
import java.nio.file.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class ExtractionService {

    private final ExtractionJobRepository repository;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private final PdfTextExtractor pdfTextExtractor;
    private final LlmFacilityAgreementExtractor llmFacilityAgreementExtractor;

    public ExtractionService(
            ExtractionJobRepository repository,
            WebClient webClient,
            ObjectMapper objectMapper,
            PdfTextExtractor pdfTextExtractor,
            LlmFacilityAgreementExtractor llmFacilityAgreementExtractor
    ) {
        this.repository = repository;
        this.webClient = webClient;
        this.objectMapper = objectMapper;
        this.pdfTextExtractor = pdfTextExtractor;
        this.llmFacilityAgreementExtractor = llmFacilityAgreementExtractor;
    }

    @Transactional
    public ExtractionResponse startAsync(StartExtractionRequest req, String authorizationHeader) {
        String jobKey = UUID.randomUUID().toString();
        Instant now = Instant.now();

        ExtractionJobEntity job = new ExtractionJobEntity();
        job.setJobKey(jobKey);
        job.setDocumentId(req.documentId());
        job.setAgreementId(req.agreementId());
        job.setExtractionProfile(req.extractionProfile());
        job.setStatus(ExtractionStatus.PENDING);
        job.setCreatedAt(now);
        job.setUpdatedAt(now);

        repository.save(job);

        processJobAsync(jobKey, authorizationHeader);
        return toResponse(job);
    }

    @Async("extractionExecutor")
    public CompletableFuture<Void> processJobAsync(String jobKey, String authorizationHeader) {
        Path pdfPath = null;

        try {
            markRunning(jobKey);

            // 1) download PDF
            pdfPath = downloadPdfToTempFile(jobKey, authorizationHeader);

            // 2) extract PDF text
            String fullText = pdfTextExtractor.extractText(pdfPath);
            if (fullText == null || fullText.isBlank()) {
                throw new IllegalStateException("PDF text extraction is empty. If this is a scanned PDF, OCR is required.");
            }

            // 3) chunk it (simple char-based chunking)
            List<String> chunks = chunkText(fullText, 12000); // ~12k chars per chunk

            // 4) build schema (the EXACT shape you want)
            ExtractionJobEntity job = getJobByKey(jobKey);
            String schema = facilityAgreementSchema(job.getExtractionProfile().name());

            // 5) LLM extraction -> JsonNode
            JsonNode extracted = llmFacilityAgreementExtractor.extract(
                    schema,
                    job.getDocumentId(),
                    job.getAgreementId(),
                    chunks
            );

            // 6) store result
            markDone(jobKey, objectMapper.writeValueAsString(extracted));

        } catch (Exception ex) {
            markFailed(jobKey, ex);
        } finally {
            if (pdfPath != null) safeDelete(pdfPath);
        }

        return CompletableFuture.completedFuture(null);
    }

    private List<String> chunkText(String text, int maxChars) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + maxChars, text.length());
            chunks.add(text.substring(start, end));
            start = end;
        }
        return chunks;
    }

    private String facilityAgreementSchema(String profile) {
        return """
        {
          "profile": "%s",
          "documentId": 0,
          "agreementId": 0,
          "parties": {
            "borrowerName": null,
            "administrativeAgentName": null,
            "lenders": [
              {"name": null, "shareAmount": null, "sharePercentage": null}
            ]
          },
          "keyDates": {
            "agreementDate": null,
            "effectiveDate": null,
            "expiryDate": null,
            "maturityDate": null
          },
          "facilities": [
            {"facilityType": null, "currency": null, "amount": null}
          ],
          "pricing": {
            "baseRate": null,
            "margin": null
          },
          "interestPeriods": []
        }
        """.formatted(profile);
    }

    private Path downloadPdfToTempFile(String jobKey, String authorizationHeader) throws IOException {
        ExtractionJobEntity job = getJobByKey(jobKey);
        Long documentId = job.getDocumentId();

        Path tmp = Files.createTempFile("dealhub-doc-" + jobKey + "-", ".pdf");

        Flux<DataBuffer> body = webClient.get()
                .uri("/documents/{id}/download", documentId)
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader == null ? "" : authorizationHeader)
                .retrieve()
                .bodyToFlux(DataBuffer.class);

        try (AsynchronousFileChannel ch = AsynchronousFileChannel.open(tmp, StandardOpenOption.WRITE)) {
            DataBufferUtils.write(body, ch, 0).then().block();
        }

        return tmp;
    }

    @Transactional(readOnly = true)
    public ExtractionResponse getByKey(String jobKey) {
        return toResponse(getJobByKey(jobKey));
    }

    private ExtractionJobEntity getJobByKey(String jobKey) {
        return repository.findByJobKey(jobKey)
                .orElseThrow(() -> new RuntimeException("Extraction job not found: " + jobKey));
    }

    @Transactional
    protected void markRunning(String jobKey) {
        ExtractionJobEntity job = getJobByKey(jobKey);
        job.setStatus(ExtractionStatus.RUNNING);
        job.setUpdatedAt(Instant.now());
        repository.save(job);
    }

    @Transactional
    protected void markDone(String jobKey, String resultJsonText) {
        ExtractionJobEntity job = getJobByKey(jobKey);

        JsonNode node;
        try {
            node = objectMapper.readTree(resultJsonText);
        } catch (Exception e) {
            node = objectMapper.createObjectNode()
                    .put("error", "Invalid JSON produced by extractor")
                    .put("details", e.getMessage())
                    .put("raw", resultJsonText);

            job.setStatus(ExtractionStatus.FAILED);
            job.setErrorMessage("Extractor produced invalid JSON: " + e.getMessage());
        }

        if (job.getStatus() != ExtractionStatus.FAILED) {
            job.setStatus(ExtractionStatus.DONE);
            job.setErrorMessage(null);
        }

        job.setResultJson(node);
        job.setUpdatedAt(Instant.now());
        repository.save(job);
    }

    @Transactional
    protected void markFailed(String jobKey, Exception ex) {
        ExtractionJobEntity job = getJobByKey(jobKey);
        job.setStatus(ExtractionStatus.FAILED);
        job.setErrorMessage(ex.getMessage());
        job.setUpdatedAt(Instant.now());
        repository.save(job);
    }

    private ExtractionResponse toResponse(ExtractionJobEntity job) {
        return new ExtractionResponse(
                job.getJobKey(),
                job.getDocumentId(),
                job.getAgreementId(),
                job.getExtractionProfile(),
                job.getStatus(),
                job.getResultJson(),
                job.getErrorMessage(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }

    private void safeDelete(Path p) {
        try { Files.deleteIfExists(p); } catch (Exception ignored) {}
    }
}
