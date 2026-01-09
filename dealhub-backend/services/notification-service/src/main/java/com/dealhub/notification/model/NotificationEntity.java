package com.dealhub.notification.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long lenderId;

    @Column(nullable = false)
    private Long agreementId;

    @Column(nullable = false)
    private Long versionId;

    @Column(nullable = false)
    private String type; // "DEAL_PUBLISHED"

    @Column(nullable = false)
    private String status; // "CREATED" | "SENT"

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
