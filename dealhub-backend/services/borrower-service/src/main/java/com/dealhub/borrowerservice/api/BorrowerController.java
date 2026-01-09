package com.dealhub.borrowerservice.api;

import com.dealhub.borrowerservice.dto.BorrowerDto;
import com.dealhub.borrowerservice.dto.CreateBorrowerRequest;
import com.dealhub.borrowerservice.dto.UpdateBorrowerRequest;
import com.dealhub.borrowerservice.service.BorrowerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/borrowers")
public class BorrowerController {

    private final BorrowerService service;

    public BorrowerController(BorrowerService service) {
        this.service = service;
    }

    @GetMapping
    public List<BorrowerDto> listMine() {
        return service.listMine();
    }

    @GetMapping("/{id}")
    public BorrowerDto getMine(@PathVariable Long id) {
        return service.getMine(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BorrowerDto create(@Valid @RequestBody CreateBorrowerRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public BorrowerDto update(@PathVariable Long id, @Valid @RequestBody UpdateBorrowerRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
