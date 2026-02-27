package com.examly.springapp.service;

import com.examly.springapp.dto.FraudAnalysisDTO;
import com.examly.springapp.model.Claim;
import com.examly.springapp.model.FraudResult;
import com.examly.springapp.repository.FraudResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;

@Service
public class FraudService {

    private static final Logger logger = LoggerFactory.getLogger(FraudService.class);

    private final FraudResultRepository fraudResultRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;

    @Value("${ai.fraud.auto-analyze:true}")
    private boolean autoAnalyze;

    public FraudService(FraudResultRepository fraudResultRepository, ObjectMapper objectMapper) {
        this.fraudResultRepository = fraudResultRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    /**
     * Analyze an image file for fraud indicators
     */
    public FraudAnalysisDTO analyzeImage(File imageFile) {
        try {
            logger.info("Sending image to AI service for fraud analysis: {}", imageFile.getName());

            // Prepare multipart request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new FileSystemResource(imageFile));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Call AI service
            String url = aiServiceUrl + "/api/analyze";
            ResponseEntity<FraudAnalysisDTO> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    FraudAnalysisDTO.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                logger.info("Fraud analysis completed. Score: {}, Status: {}",
                        response.getBody().getFraudScore(),
                        response.getBody().getImageStatus());
                return response.getBody();
            } else {
                logger.warn("AI service returned unexpected response");
                return createDefaultAnalysis("AI service unavailable");
            }

        } catch (Exception e) {
            logger.error("Error calling AI fraud detection service: {}", e.getMessage(), e);
            return createDefaultAnalysis("Analysis failed: " + e.getMessage());
        }
    }

    /**
     * Save fraud analysis result to database
     */
    public FraudResult saveFraudResult(Claim claim, FraudAnalysisDTO analysis) {
        try {
            FraudResult fraudResult = new FraudResult();
            fraudResult.setClaim(claim);
            fraudResult.setImageStatus(FraudResult.ImageStatus.valueOf(analysis.getImageStatus()));
            fraudResult.setFraudScore(analysis.getFraudScore());
            fraudResult.setConfidence(analysis.getConfidence());
            fraudResult.setRemarks(analysis.getRemarks());

            // Convert details to JSON string
            if (analysis.getDetails() != null) {
                String detailsJson = objectMapper.writeValueAsString(analysis.getDetails());
                fraudResult.setDetails(detailsJson);
            }

            FraudResult saved = fraudResultRepository.save(fraudResult);
            logger.info("Saved fraud result for claim ID: {}", claim.getId());

            return saved;
        } catch (Exception e) {
            logger.error("Error saving fraud result: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save fraud result", e);
        }
    }

    /**
     * Get fraud result for a specific claim
     */
    public FraudResult getFraudResultByClaim(Long claimId) {
        return fraudResultRepository.findByClaimId(claimId).orElse(null);
    }

    /**
     * Check if AI service is available
     */
    public boolean isAiServiceAvailable() {
        try {
            String healthUrl = aiServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.warn("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get fraud statistics
     */
    public FraudStatistics getFraudStatistics() {
        FraudStatistics stats = new FraudStatistics();
        stats.setTotalAnalyzed(fraudResultRepository.count());
        stats.setSuspiciousCount(fraudResultRepository.countSuspicious());
        stats.setFraudCount(fraudResultRepository.countFraud());
        stats.setGenuineCount(stats.getTotalAnalyzed() - stats.getSuspiciousCount() - stats.getFraudCount());
        return stats;
    }

    /**
     * Create a default analysis when AI service is unavailable
     */
    private FraudAnalysisDTO createDefaultAnalysis(String reason) {
        FraudAnalysisDTO analysis = new FraudAnalysisDTO();
        analysis.setImageStatus("SUSPICIOUS");
        analysis.setFraudScore(50);
        analysis.setConfidence(30);
        analysis.setRemarks("Could not complete AI analysis: " + reason + ". Manual review recommended.");
        return analysis;
    }

    // Inner class for fraud statistics
    public static class FraudStatistics {
        private long totalAnalyzed;
        private long genuineCount;
        private long suspiciousCount;
        private long fraudCount;

        // Getters and Setters
        public long getTotalAnalyzed() {
            return totalAnalyzed;
        }

        public void setTotalAnalyzed(long totalAnalyzed) {
            this.totalAnalyzed = totalAnalyzed;
        }

        public long getGenuineCount() {
            return genuineCount;
        }

        public void setGenuineCount(long genuineCount) {
            this.genuineCount = genuineCount;
        }

        public long getSuspiciousCount() {
            return suspiciousCount;
        }

        public void setSuspiciousCount(long suspiciousCount) {
            this.suspiciousCount = suspiciousCount;
        }

        public long getFraudCount() {
            return fraudCount;
        }

        public void setFraudCount(long fraudCount) {
            this.fraudCount = fraudCount;
        }
    }
}
