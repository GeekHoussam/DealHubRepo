package com.dealhub.extraction.service;

import com.dealhub.extraction.model.ExtractionProfile;
import org.springframework.stereotype.Component;

@Component
public class ExtractionSchemaResolver {

    public String schemaFor(ExtractionProfile profile) {
        if (profile == ExtractionProfile.FACILITY_AGREEMENT) {
            return FacilityAgreementSchema.jsonSchema();
        }
        return FacilityAgreementSchema.jsonSchema();
    }
}
