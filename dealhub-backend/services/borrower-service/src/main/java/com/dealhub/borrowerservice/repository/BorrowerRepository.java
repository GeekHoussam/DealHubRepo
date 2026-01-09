package com.dealhub.borrowerservice.repository;

import com.dealhub.borrowerservice.model.BorrowerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BorrowerRepository extends JpaRepository<BorrowerEntity, Long> {

    List<BorrowerEntity> findByAgentIdOrderByNameAsc(Long agentId);

    Optional<BorrowerEntity> findByIdAndAgentId(Long id, Long agentId);

    boolean existsByIdAndAgentId(Long id, Long agentId);
}
