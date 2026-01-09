package com.dealhub.extraction.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "extraction_jobs",
        indexes = {
                @Index(name = "idx_extraction_jobs_job_key", columnList = "job_key")
        }
)
public class ExtractionJobEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ External public identifier (UUID) used by API + async worker
    @Column(name = "job_key", nullable = false, unique = true, length = 36)
    private String jobKey;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "agreement_id", nullable = false)
    private Long agreementId;

    @Enumerated(EnumType.STRING)
    @Column(name = "extraction_profile", nullable = false)
    private ExtractionProfile extractionProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ExtractionStatus status;

    @Type(JsonType.class)
    @Column(name = "result_json", columnDefinition = "json")
    private JsonNode resultJson;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
