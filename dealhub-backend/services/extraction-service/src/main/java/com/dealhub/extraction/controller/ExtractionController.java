package com.dealhub.extraction.controller;

import com.dealhub.extraction.dto.ExtractionResponse;
import com.dealhub.extraction.dto.StartExtractionRequest;
import com.dealhub.extraction.service.ExtractionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/extractions")
public class ExtractionController {

    private final ExtractionService extractionService;

    public ExtractionController(ExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @PostMapping("/start")
    public ExtractionResponse start(
            @Valid @RequestBody StartExtractionRequest request,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return extractionService.startAsync(request, authorization);
    }

    @GetMapping("/{id}")
    public ExtractionResponse getById(@PathVariable String id) {
        return extractionService.getByKey(id);
    }
}
