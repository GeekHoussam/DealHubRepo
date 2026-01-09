package com.dealhub.extraction.service.extractor;

import org.springframework.stereotype.Component;

@Component
public class FacilityAgreementExtractor {

    /**
     * Hackathon stub: returns JSON.
     * Next step: replace with Spring AI extraction.
     */
    public String extract(String documentText) {

        // TODO: real parsing / LLM prompt
        return """
        {
          "borrower": "Demo Borrower",
          "agent": "Demo Agent Bank",
          "facilities": [
            { "type": "RCF", "amount": "1000000", "currency": "EUR" }
          ],
          "source": "extraction-service-stub"
        }
        """;
    }
}
