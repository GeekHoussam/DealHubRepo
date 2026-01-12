package com.dealhub.document.controller;

import com.dealhub.document.dto.UploadDocumentResponse;
import com.dealhub.document.model.DocumentEntity;
import com.dealhub.document.repository.DocumentRepository;
import com.dealhub.document.service.DocumentService;
import com.dealhub.document.service.FileStorageService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final FileStorageService storage;

    public DocumentController(DocumentService documentService,
                              DocumentRepository documentRepository,
                              FileStorageService storage) {
        this.documentService = documentService;
        this.documentRepository = documentRepository;
        this.storage = storage;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadDocumentResponse upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "agreementId", required = false) Long agreementId,
            @RequestParam(value = "documentType", defaultValue = "FACILITY_AGREEMENT") String documentType,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return documentService.upload(file, agreementId, documentType, authorization);
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long documentId) {

        DocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Document not found"));

        String storedFilename = doc.getStoredFilename();
        if (!StringUtils.hasText(storedFilename)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "storedFilename is missing");
        }

        Path filePath = storage.resolve(storedFilename);

        if (!Files.exists(filePath)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.GONE, "File is missing on disk");
        }

        Resource resource = new FileSystemResource(filePath);

        String originalFilename = StringUtils.hasText(doc.getOriginalFilename())
                ? doc.getOriginalFilename()
                : ("document-" + documentId);

        String contentType = StringUtils.hasText(doc.getContentType())
                ? doc.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFilename + "\"")
                .body(resource);
    }
}
