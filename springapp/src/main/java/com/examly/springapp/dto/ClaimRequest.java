package com.examly.springapp.dto;

public class ClaimRequest {
    private String description;
    private String policyNumber;
    private Long claimTypeId;
    private Double amount;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public Long getClaimTypeId() {
        return claimTypeId;
    }

    public void setClaimTypeId(Long claimTypeId) {
        this.claimTypeId = claimTypeId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
