package com.dealhub.document.repository;

import com.dealhub.document.model.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {
    List<DocumentEntity> findByAgreementId(Long agreementId);
    List<DocumentEntity> findByAgreementIdAndDocumentType(Long agreementId, String documentType);
}
