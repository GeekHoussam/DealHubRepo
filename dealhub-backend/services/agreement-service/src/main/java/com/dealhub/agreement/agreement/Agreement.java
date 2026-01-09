package com.dealhub.agreement.agreement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "agreements")
@Getter
@Setter
@NoArgsConstructor
public class Agreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String borrower;

    @Column(nullable = false)
    private String agent;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Agreement(String name, String borrower, String agent) {
        this.name = name;
        this.borrower = borrower;
        this.agent = agent;
    }
}
