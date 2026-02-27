package com.examly.springapp.dto;

public class ClaimStatusUpdateRequest {
    private String response;

    public ClaimStatusUpdateRequest() {
    }

    public ClaimStatusUpdateRequest(String response) {
        this.response = response;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }
}
