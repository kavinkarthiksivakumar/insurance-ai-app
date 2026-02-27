package com.examly.springapp.dto;

import com.examly.springapp.model.EvidenceValidationResult.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class EvidenceValidationResultDTO {

    private Long id;
    private Long claimId;
    private Integer completenessScore;
    private Integer relevanceScore;
    private Integer ocrConsistencyScore;
    private Integer overallScore;
    private ValidationStatus status;
    private List<String> missingDocuments;
    private List<String> warnings;
    private Map<String, Object> extractedFields;
    private LocalDateTime validationDate;
    private WorkflowRoute recommendedRoute;

    // Default constructor
    public EvidenceValidationResultDTO() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClaimId() {
        return claimId;
    }

    public void setClaimId(Long claimId) {
        this.claimId = claimId;
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

    public List<String> getMissingDocuments() {
        return missingDocuments;
    }

    public void setMissingDocuments(List<String> missingDocuments) {
        this.missingDocuments = missingDocuments;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public Map<String, Object> getExtractedFields() {
        return extractedFields;
    }

    public void setExtractedFields(Map<String, Object> extractedFields) {
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
