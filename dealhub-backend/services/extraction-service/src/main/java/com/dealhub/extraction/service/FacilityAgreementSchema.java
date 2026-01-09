package com.dealhub.extraction.service;

public final class FacilityAgreementSchema {

    private FacilityAgreementSchema() {}

    public static String jsonSchema() {
        return """
        {
          "profile": "FACILITY_AGREEMENT",
          "documentId": null,
          "agreementId": null,

          "parties": {
            "borrower": {
              "legalName": { "value": null, "citation": null, "evidence": null },
              "jurisdiction": { "value": null, "citation": null, "evidence": null },
              "registeredAddress": { "value": null, "citation": null, "evidence": null }
            },
            "administrativeAgent": {
              "legalName": { "value": null, "citation": null, "evidence": null }
            },
            "lenders": [
              {
                "legalName": { "value": null, "citation": null, "evidence": null },
                "commitmentAmount": { "value": null, "citation": null, "evidence": null },
                "commitmentCurrency": { "value": null, "citation": null, "evidence": null },
                "commitmentPercentage": { "value": null, "citation": null, "evidence": null }
              }
            ]
          },

          "keyDates": {
            "agreementDate": { "value": null, "citation": null, "evidence": null },
            "effectiveOrCommencementDate": { "value": null, "citation": null, "evidence": null },
            "expiryDate": { "value": null, "citation": null, "evidence": null },
            "maturityDate": { "value": null, "citation": null, "evidence": null }
          },

          "facilities": [
            {
              "facilityType": { "value": null, "citation": null, "evidence": null },
              "currency": { "value": null, "citation": null, "evidence": null },
              "amount": { "value": null, "citation": null, "evidence": null }
            }
          ],

          "pricing": {
            "baseRateOrRfr": { "value": null, "citation": null, "evidence": null },
            "margin": { "value": null, "citation": null, "evidence": null }
          },

          "interestPeriods": [
            {
              "period": { "value": null, "citation": null, "evidence": null }
            }
          ],

          "validationAndGaps": {
            "missingItems": [],
            "nonSearchablePages": [],
            "notes": []
          }
        }
        """;
    }
}
