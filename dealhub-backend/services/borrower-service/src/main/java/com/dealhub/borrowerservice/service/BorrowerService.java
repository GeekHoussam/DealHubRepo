package com.dealhub.borrowerservice.service;

import com.dealhub.borrowerservice.dto.BorrowerDto;
import com.dealhub.borrowerservice.dto.CreateBorrowerRequest;
import com.dealhub.borrowerservice.dto.UpdateBorrowerRequest;
import com.dealhub.borrowerservice.model.BorrowerEntity;
import com.dealhub.borrowerservice.repository.BorrowerRepository;
import com.dealhub.borrowerservice.security.CurrentAgent;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class BorrowerService {

    private final BorrowerRepository repo;
    private final CurrentAgent currentAgent;

    public BorrowerService(BorrowerRepository repo, CurrentAgent currentAgent) {
        this.repo = repo;
        this.currentAgent = currentAgent;
    }

    public List<BorrowerDto> listMine() {
        Long agentId = currentAgent.requireAgentId();
        return repo.findByAgentIdOrderByNameAsc(agentId).stream()
                .map(b -> new BorrowerDto(b.getId(), b.getName()))
                .toList();
    }

    public BorrowerDto getMine(Long id) {
        Long agentId = currentAgent.requireAgentId();
        BorrowerEntity b = repo.findByIdAndAgentId(id, agentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrower not found"));
        return new BorrowerDto(b.getId(), b.getName());
    }

    public BorrowerDto create(CreateBorrowerRequest req) {
        Long agentId = currentAgent.requireAgentId();
        BorrowerEntity b = new BorrowerEntity(agentId, req.name().trim());
        b = repo.save(b);
        return new BorrowerDto(b.getId(), b.getName());
    }

    public BorrowerDto update(Long id, UpdateBorrowerRequest req) {
        Long agentId = currentAgent.requireAgentId();
        BorrowerEntity b = repo.findByIdAndAgentId(id, agentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrower not found"));

        b.setName(req.name().trim());
        b = repo.save(b);

        return new BorrowerDto(b.getId(), b.getName());
    }

    public void delete(Long id) {
        Long agentId = currentAgent.requireAgentId();
        if (!repo.existsByIdAndAgentId(id, agentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrower not found");
        }
        repo.deleteById(id);
    }
}
