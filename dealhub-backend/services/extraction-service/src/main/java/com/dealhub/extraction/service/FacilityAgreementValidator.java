package com.dealhub.extraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class FacilityAgreementValidator {

    public void validate(JsonNode root) {
        if (root == null || !root.isObject()) {
            throw new IllegalArgumentException("Extractor returned empty/invalid JSON");
        }
        require(root, "profile");
        require(root, "parties");
        require(root, "keyDates");
        require(root, "facilities");
        require(root, "pricing");

        String profile = root.path("profile").asText("");
        if (!"FACILITY_AGREEMENT".equals(profile)) {
            throw new IllegalArgumentException("Invalid profile: " + profile);
        }
    }

    private void require(JsonNode node, String field) {
        if (!node.has(field)) {
            throw new IllegalArgumentException("Missing required field: " + field);
        }
    }
}
