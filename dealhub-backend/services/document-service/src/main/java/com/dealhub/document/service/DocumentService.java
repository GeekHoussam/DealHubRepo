package com.dealhub.document.service;

import com.dealhub.document.dto.UploadDocumentResponse;
import com.dealhub.document.integration.AgreementGatewayClient;
import com.dealhub.document.integration.dto.CreateAgreementRequest;
import com.dealhub.document.integration.dto.CreateAgreementResponse;
import com.dealhub.document.model.DocumentEntity;
import com.dealhub.document.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

    private final DocumentRepository repository;
    private final FileStorageService storage;
    private final AgreementGatewayClient agreementClient;

    public DocumentService(DocumentRepository repository,
                           FileStorageService storage,
                           AgreementGatewayClient agreementClient) {
        this.repository = repository;
        this.storage = storage;
        this.agreementClient = agreementClient;
    }

    public UploadDocumentResponse upload(MultipartFile file,
                                         Long agreementId,
                                         String documentType,
                                         String authorization) {

        if (agreementId == null) {
            String filename = (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank())
                    ? "Uploaded document"
                    : file.getOriginalFilename();

            CreateAgreementRequest req = new CreateAgreementRequest(
                    filename,
                    "UNKNOWN_BORROWER",
                    "UNKNOWN_AGENT"
            );

            CreateAgreementResponse created = agreementClient.createAgreement(req, authorization).block();
            if (created == null || created.id() == null) {
                throw new RuntimeException("Failed to auto-create agreement");
            }
            agreementId = created.id();
        }

        FileStorageService.StoredFile stored = storage.store(file);

        DocumentEntity doc = new DocumentEntity();
        doc.setAgreementId(agreementId);
        doc.setDocumentType(documentType);
        doc.setOriginalFilename(file.getOriginalFilename());
        doc.setStoredFilename(stored.storedFilename());
        doc.setSha256(stored.sha256());
        doc.setSizeBytes(file.getSize());
        String contentType = file.getContentType();
        doc.setContentType(contentType != null ? contentType : "application/octet-stream");

        try {
            DocumentEntity saved = repository.save(doc);
            return new UploadDocumentResponse(saved.getId(), agreementId, "Uploaded successfully");
        } catch (RuntimeException ex) {
            // prevent orphan file if DB insert fails
            storage.deleteIfExists(stored.storedFilename());
            throw ex;
        }
    }
}
