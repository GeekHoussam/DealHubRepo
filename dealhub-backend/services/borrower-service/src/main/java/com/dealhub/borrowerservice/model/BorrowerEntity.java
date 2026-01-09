package com.dealhub.borrowerservice.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "borrowers",
        indexes = {
                @Index(name = "idx_borrowers_agent_id", columnList = "agent_id"),
                @Index(name = "idx_borrowers_name", columnList = "name")
        }
)
public class BorrowerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(nullable = false, length = 200)
    private String name;

    public BorrowerEntity() {}

    public BorrowerEntity(Long agentId, String name) {
        this.agentId = agentId;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
