package com.dealhub.extraction.service;

import com.dealhub.extraction.model.ExtractionProfile;
import org.springframework.stereotype.Component;

@Component
public class LlmPromptBuilder {

    public String buildPrompt(
            ExtractionProfile profile,
            Long documentId,
            Long agreementId,
            String pdfText
    ) {

        return """
You are a senior banking legal analyst.

Extract structured data from the following Facility Agreement document.

OUTPUT STRICT JSON ONLY (no markdown, no explanations).

JSON SCHEMA:
{
  "profile": "%s",
  "documentId": %d,
  "agreementId": %d,
  "parties": {
    "borrowerName": "...",
    "administrativeAgentName": "...",
    "lenders": [
      {
        "name": "...",
        "shareAmount": "...",
        "sharePercentage": "..."
      }
    ]
  },
  "keyDates": {
    "agreementDate": "YYYY-MM-DD",
    "effectiveDate": "YYYY-MM-DD",
    "expiryDate": "YYYY-MM-DD",
    "maturityDate": "YYYY-MM-DD"
  },
  "facilities": [
    {
      "facilityType": "TERM|RCF",
      "currency": "USD|EUR|...",
      "amount": "..."
    }
  ],
  "pricing": {
    "baseRate": "SOFR|EURIBOR|...",
    "margin": "..."
  },
  "interestPeriods": ["1M","3M","6M"]
}

DOCUMENT TEXT:
----------------
%s
----------------
"""
                .formatted(
                        profile.name(),
                        documentId,
                        agreementId,
                        pdfText
                );
    }
}
