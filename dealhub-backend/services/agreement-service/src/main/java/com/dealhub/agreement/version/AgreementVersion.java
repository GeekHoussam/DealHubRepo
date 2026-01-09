package com.dealhub.agreement.version;

import com.fasterxml.jackson.databind.JsonNode;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;

@Entity
@Table(name = "agreement_versions")
@Getter
@Setter
@NoArgsConstructor
public class AgreementVersion {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long agreementId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgreementStatus status = AgreementStatus.DRAFT;

    // ✅ Store extracted JSON as REAL JSON (not String)
    @Type(JsonType.class)
    @Column(name = "extracted_json", columnDefinition = "json", nullable = false)
    private JsonNode extractedJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant validatedAt;
    private Long validatedBy;

    public AgreementVersion(Long agreementId, JsonNode extractedJson) {
        this.agreementId = agreementId;
        this.extractedJson = extractedJson;
    }

    public void validate(Long userId) {
        this.status = AgreementStatus.VALIDATED;
        this.validatedAt = Instant.now();
        this.validatedBy = userId;
    }

    private Instant publishedAt;
    private Long publishedBy;

    public void publish(Long userId) {
        if (this.status != AgreementStatus.VALIDATED) {
            throw new IllegalStateException("Only VALIDATED versions can be published");
        }
        this.status = AgreementStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.publishedBy = userId;
    }
}
