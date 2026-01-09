// document-service/src/main/java/com/dealhub/document/integration/dto/CreateAgreementRequest.java
package com.dealhub.document.integration.dto;

public record CreateAgreementRequest(
        String name,
        String borrower,
        String agent
) {}
