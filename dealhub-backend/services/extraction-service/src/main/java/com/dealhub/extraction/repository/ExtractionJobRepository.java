package com.dealhub.extraction.repository;

import com.dealhub.extraction.model.ExtractionJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExtractionJobRepository extends JpaRepository<ExtractionJobEntity, Long> {
    Optional<ExtractionJobEntity> findByJobKey(String jobKey);
}
