package com.dealhub.document.dto;

import java.util.Map;

public class ExtractionResponse {
    private String jobKey;
    private String status;  // DONE / FAILED / PENDING
    private Map<String, Object> resultJson; // The actual extraction data
    private String errorMessage;

    // Static method to create failed response
    public static ExtractionResponse failed(Long documentId, Long agreementId, String extractionProfile, String error) {
        ExtractionResponse r = new ExtractionResponse();
        r.setStatus("FAILED");
        r.setErrorMessage(error);
        return r;
    }

    // Getters and Setters

    public String getJobKey() {
        return jobKey;
    }

    public void setJobKey(String jobKey) {
        this.jobKey = jobKey;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, Object> getResultJson() {
        return resultJson;
    }

    public void setResultJson(Map<String, Object> resultJson) {
        this.resultJson = resultJson;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
