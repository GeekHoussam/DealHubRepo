package com.dealhub.extraction.service;

import com.dealhub.extraction.model.ExtractionJobEntity;
import com.dealhub.extraction.model.ExtractionStatus;
import com.dealhub.extraction.repository.ExtractionJobRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

@Service
public class ExtractionWorker {

    private final ExtractionJobRepository repository;
    private final DocumentDownloadService documentDownloadService;
    private final PdfTextExtractor pdfTextExtractor;
    private final TextChunker textChunker;
    private final ExtractionSchemaResolver schemaResolver;
    private final LlmFacilityAgreementExtractor llmExtractor;
    private final FacilityAgreementValidator facilityAgreementValidator;

    public ExtractionWorker(
            ExtractionJobRepository repository,
            DocumentDownloadService documentDownloadService,
            PdfTextExtractor pdfTextExtractor,
            TextChunker textChunker,
            ExtractionSchemaResolver schemaResolver,
            LlmFacilityAgreementExtractor llmExtractor,
            FacilityAgreementValidator facilityAgreementValidator
    ) {
        this.repository = repository;
        this.documentDownloadService = documentDownloadService;
        this.pdfTextExtractor = pdfTextExtractor;
        this.textChunker = textChunker;
        this.schemaResolver = schemaResolver;
        this.llmExtractor = llmExtractor;
        this.facilityAgreementValidator = facilityAgreementValidator;
    }

    @Async("extractionExecutor")
    public void runJob(String jobKey, String authorizationHeader) {
        ExtractionJobEntity job = repository.findByJobKey(jobKey)
                .orElseThrow(() -> new RuntimeException("Extraction job not found: " + jobKey));

        job.setStatus(ExtractionStatus.RUNNING);
        job.setUpdatedAt(Instant.now());
        repository.save(job);

        Path tmpPdf = null;

        try {
            tmpPdf = documentDownloadService.downloadToTempFile(job.getDocumentId(), authorizationHeader);

            String fullText = pdfTextExtractor.extractText(tmpPdf);
            if (fullText == null || fullText.isBlank()) {
                throw new IllegalStateException("PDF text extraction is empty (maybe scanned PDF).");
            }

            List<String> chunks = textChunker.chunk(fullText, 12_000);

            String schema = schemaResolver.schemaFor(job.getExtractionProfile());

            JsonNode extracted = llmExtractor.extract(
                    schema,
                    job.getDocumentId(),
                    job.getAgreementId(),
                    chunks
            );

            facilityAgreementValidator.validate(extracted);

            job.setStatus(ExtractionStatus.DONE);
            job.setResultJson(extracted);
            job.setErrorMessage(null);
            job.setUpdatedAt(Instant.now());
            repository.save(job);

        } catch (Exception ex) {
            job.setStatus(ExtractionStatus.FAILED);
            job.setErrorMessage(ex.getMessage());
            job.setUpdatedAt(Instant.now());
            repository.save(job);

        } finally {
            if (tmpPdf != null) {
                documentDownloadService.safeDelete(tmpPdf);
            }
        }
    }
}
