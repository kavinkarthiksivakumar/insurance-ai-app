package com.examly.springapp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evidence_validation_results")
public class EvidenceValidationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "claim_id", unique = true)
    private Claim claim;

    @Column(name = "completeness_score")
    private Integer completenessScore; // 0-100

    @Column(name = "relevance_score")
    private Integer relevanceScore; // 0-100

    @Column(name = "ocr_consistency_score")
    private Integer ocrConsistencyScore; // 0-100

    @Column(name = "overall_score")
    private Integer overallScore; // Computed aggregate score

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ValidationStatus status;

    @Column(name = "missing_documents", columnDefinition = "TEXT")
    private String missingDocuments; // JSON array of missing document types

    @Column(columnDefinition = "TEXT")
    private String warnings; // JSON array of warnings

    @Column(name = "extracted_fields", columnDefinition = "TEXT")
    private String extractedFields; // JSON object with OCR extracted data

    @Column(name = "validation_date")
    private LocalDateTime validationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_route")
    private WorkflowRoute recommendedRoute;

    public enum ValidationStatus {
        COMPLETE, INCOMPLETE, INCONSISTENT, PENDING
    }

    public enum WorkflowRoute {
        FAST_TRACK, // Low fraud + complete evidence
        STANDARD, // Medium risk or partial completeness
        INVESTIGATION, // High fraud or low completeness
        RESUBMISSION // Missing required documents
    }

    public EvidenceValidationResult() {
        this.validationDate = LocalDateTime.now();
        this.status = ValidationStatus.PENDING;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonIgnore
    public Claim getClaim() {
        return claim;
    }

    public void setClaim(Claim claim) {
        this.claim = claim;
    }

    public Integer getCompletenessScore() {
        return completenessScore;
    }

    public void setCompletenessScore(Integer completenessScore) {
        this.completenessScore = completenessScore;
    }

    public Integer getRelevanceScore() {
        return relevanceScore;
    }

    public void setRelevanceScore(Integer relevanceScore) {
        this.relevanceScore = relevanceScore;
    }

    public Integer getOcrConsistencyScore() {
        return ocrConsistencyScore;
    }

    public void setOcrConsistencyScore(Integer ocrConsistencyScore) {
        this.ocrConsistencyScore = ocrConsistencyScore;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public ValidationStatus getStatus() {
        return status;
    }

    public void setStatus(ValidationStatus status) {
        this.status = status;
    }

    public String getMissingDocuments() {
        return missingDocuments;
    }

    public void setMissingDocuments(String missingDocuments) {
        this.missingDocuments = missingDocuments;
    }

    public String getWarnings() {
        return warnings;
    }

    public void setWarnings(String warnings) {
        this.warnings = warnings;
    }

    public String getExtractedFields() {
        return extractedFields;
    }

    public void setExtractedFields(String extractedFields) {
        this.extractedFields = extractedFields;
    }

    public LocalDateTime getValidationDate() {
        return validationDate;
    }

    public void setValidationDate(LocalDateTime validationDate) {
        this.validationDate = validationDate;
    }

    public WorkflowRoute getRecommendedRoute() {
        return recommendedRoute;
    }

    public void setRecommendedRoute(WorkflowRoute recommendedRoute) {
        this.recommendedRoute = recommendedRoute;
    }
}
