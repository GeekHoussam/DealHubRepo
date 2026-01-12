package com.dealhub.lendermock.inbox;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "lender_inbox_message",
        indexes = {
                @Index(name = "idx_inbox_lender", columnList = "lender_id, created_at")
        }
)
public class InboxMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deal_name")
    private String dealName;

    @Column(name = "lender_id", nullable = false)
    private Long lenderId;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Lob
    @Column(name = "payload", nullable = false, columnDefinition = "LONGTEXT")
    private String payload;

    protected InboxMessageEntity() {}

    public InboxMessageEntity(String dealName, Long lenderId, String recipientEmail, String payload) {
        this.dealName = dealName;
        this.lenderId = lenderId;
        this.recipientEmail = recipientEmail;
        this.payload = payload;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getDealName() { return dealName; }
    public Long getLenderId() { return lenderId; }
    public String getRecipientEmail() { return recipientEmail; }
    public Instant getCreatedAt() { return createdAt; }
    public String getPayload() { return payload; }
}
