package com.examly.springapp.dto;

public class FraudAnalysisDTO {

    private String imageStatus;
    private Integer fraudScore;
    private Integer confidence;
    private String remarks;
    private FraudDetailsDTO details;

    public FraudAnalysisDTO() {
    }

    // Getters and Setters
    public String getImageStatus() {
        return imageStatus;
    }

    public void setImageStatus(String imageStatus) {
        this.imageStatus = imageStatus;
    }

    public Integer getFraudScore() {
        return fraudScore;
    }

    public void setFraudScore(Integer fraudScore) {
        this.fraudScore = fraudScore;
    }

    public Integer getConfidence() {
        return confidence;
    }

    public void setConfidence(Integer confidence) {
        this.confidence = confidence;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public FraudDetailsDTO getDetails() {
        return details;
    }

    public void setDetails(FraudDetailsDTO details) {
        this.details = details;
    }

    // Inner class for fraud details
    public static class FraudDetailsDTO {
        private String imageQuality;
        private String[] metadataFlags;
        private String detectionMethod;
        private String analysisTimestamp;
        private String[] warnings;

        // Getters and Setters
        public String getImageQuality() {
            return imageQuality;
        }

        public void setImageQuality(String imageQuality) {
            this.imageQuality = imageQuality;
        }

        public String[] getMetadataFlags() {
            return metadataFlags;
        }

        public void setMetadataFlags(String[] metadataFlags) {
            this.metadataFlags = metadataFlags;
        }

        public String getDetectionMethod() {
            return detectionMethod;
        }

        public void setDetectionMethod(String detectionMethod) {
            this.detectionMethod = detectionMethod;
        }

        public String getAnalysisTimestamp() {
            return analysisTimestamp;
        }

        public void setAnalysisTimestamp(String analysisTimestamp) {
            this.analysisTimestamp = analysisTimestamp;
        }

        public String[] getWarnings() {
            return warnings;
        }

        public void setWarnings(String[] warnings) {
            this.warnings = warnings;
        }
    }
}
