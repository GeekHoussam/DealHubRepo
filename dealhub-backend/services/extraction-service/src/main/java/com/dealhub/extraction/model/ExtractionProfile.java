package com.dealhub.extraction.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ExtractionProfile {
    FACILITY_AGREEMENT;

    @JsonCreator
    public static ExtractionProfile from(String raw) {
        if (raw == null || raw.isBlank()) return FACILITY_AGREEMENT;

        String v = raw.trim().toUpperCase(Locale.ROOT)
                .replace("-", "_")
                .replace(" ", "_");

        // allow common shortcuts / typos (hackathon friendly)
        if (v.equals("FACILITYAGREEMENT") || v.equals("FACILITY8AGREEMENT") || v.equals("FAC")) {
            return FACILITY_AGREEMENT;
        }

        return ExtractionProfile.valueOf(v);
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}
