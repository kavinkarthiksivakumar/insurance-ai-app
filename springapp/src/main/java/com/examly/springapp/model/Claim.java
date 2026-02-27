package com.examly.springapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims")
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "claim_type_id", nullable = false)
    private ClaimType claimType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status;

    @ManyToOne
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    private Double amount;

    private String policyNumber;

    @Column(name = "submission_date")
    private LocalDateTime submissionDate;

    @Column(columnDefinition = "TEXT")
    private String agentResponse;

    @Column(name = "description_verified", nullable = false)
    private boolean descriptionVerified = false;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private FraudResult fraudResult;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EvidenceValidationResult evidenceValidationResult;

    public enum ClaimStatus {
        SUBMITTED, IN_REVIEW, APPROVED, REJECTED
    }

    public Claim() {
        this.submissionDate = LocalDateTime.now();
        this.status = ClaimStatus.SUBMITTED;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public ClaimType getClaimType() {
        return claimType;
    }

    public void setClaimType(ClaimType claimType) {
        this.claimType = claimType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public User getAssignedAgent() {
        return assignedAgent;
    }

    public void setAssignedAgent(User assignedAgent) {
        this.assignedAgent = assignedAgent;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public LocalDateTime getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(LocalDateTime submissionDate) {
        this.submissionDate = submissionDate;
    }

    public String getAgentResponse() {
        return agentResponse;
    }

    public void setAgentResponse(String agentResponse) {
        this.agentResponse = agentResponse;
    }

    public boolean isDescriptionVerified() {
        return descriptionVerified;
    }

    public void setDescriptionVerified(boolean descriptionVerified) {
        this.descriptionVerified = descriptionVerified;
    }

    public FraudResult getFraudResult() {
        return fraudResult;
    }

    public void setFraudResult(FraudResult fraudResult) {
        this.fraudResult = fraudResult;
    }

    public EvidenceValidationResult getEvidenceValidationResult() {
        return evidenceValidationResult;
    }

    public void setEvidenceValidationResult(EvidenceValidationResult evidenceValidationResult) {
        this.evidenceValidationResult = evidenceValidationResult;
    }
}
