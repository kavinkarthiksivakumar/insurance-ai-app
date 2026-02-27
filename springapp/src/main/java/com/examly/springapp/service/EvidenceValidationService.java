package com.examly.springapp.service;

import com.examly.springapp.model.*;
import com.examly.springapp.model.EvidenceValidationResult.ValidationStatus;
import com.examly.springapp.model.EvidenceValidationResult.WorkflowRoute;
import com.examly.springapp.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class EvidenceValidationService {

    private static final Logger logger = LoggerFactory.getLogger(EvidenceValidationService.class);
    private static final String AI_SERVICE_URL = "http://localhost:5000";

    @Autowired
    private EvidenceValidationResultRepository evidenceValidationResultRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimDocumentRepository claimDocumentRepository;

    @Autowired
    private DocumentRequirementRepository documentRequirementRepository;

    @Autowired
    private FraudResultRepository fraudResultRepository;

    @Autowired
    private DocumentRequirementService documentRequirementService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Main orchestration method for evidence validation
     */
    @Transactional
    public EvidenceValidationResult validateClaimEvidence(Long claimId) {
        logger.info("Starting evidence validation for claim ID: {}", claimId);

        try {
            // Get claim
            Claim claim = claimRepository.findById(claimId)
                    .orElseThrow(() -> new RuntimeException("Claim not found: " + claimId));

            // Get claim documents
            List<ClaimDocument> documents = claimDocumentRepository.findByClaimId(claimId);

            // Create or get existing validation result
            EvidenceValidationResult validationResult = evidenceValidationResultRepository
                    .findByClaimId(claimId)
                    .orElse(new EvidenceValidationResult());

            validationResult.setClaim(claim);

            // Step 1: Check completeness
            int completenessScore = checkCompleteness(claim, documents, validationResult);
            validationResult.setCompletenessScore(completenessScore);

            // Step 2: Classify documents and analyze relevance
            int relevanceScore = analyzeDocumentRelevance(documents, claim.getClaimType(), validationResult);
            validationResult.setRelevanceScore(relevanceScore);

            // Step 3: Extract OCR fields
            int ocrScore = extractOcrFields(documents, validationResult);
            validationResult.setOcrConsistencyScore(ocrScore);

            // Step 4: Calculate overall score
            int overallScore = calculateOverallScore(completenessScore, relevanceScore, ocrScore);
            validationResult.setOverallScore(overallScore);

            // Step 5: Determine validation status
            ValidationStatus status = determineStatus(completenessScore, relevanceScore, ocrScore, validationResult);
            validationResult.setStatus(status);

            // Step 6: Determine workflow route
            FraudResult fraudResult = fraudResultRepository.findByClaimId(claimId).orElse(null);
            int fraudScore = (fraudResult != null) ? fraudResult.getFraudScore() : 0;
            WorkflowRoute route = determineWorkflowRoute(completenessScore, relevanceScore, ocrScore, fraudScore);
            validationResult.setRecommendedRoute(route);

            // Save result
            evidenceValidationResultRepository.save(validationResult);

            logger.info("Evidence validation completed for claim ID: {}. Overall Score: {}, Route: {}",
                    claimId, overallScore, route);

            return validationResult;

        } catch (Exception e) {
            logger.error("Error validating evidence for claim {}: {}", claimId, e.getMessage(), e);
            throw new RuntimeException("Evidence validation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Check if all required documents are present
     */
    private int checkCompleteness(Claim claim, List<ClaimDocument> documents,
            EvidenceValidationResult validationResult) {
        logger.debug("Checking document completeness for claim {}", claim.getId());

        // Get required documents for this claim type
        List<DocumentRequirement> requirements = documentRequirementService
                .getMandatoryRequirements(claim.getClaimType().getId());

        if (requirements.isEmpty()) {
            logger.warn("No requirements defined for claim type: {}", claim.getClaimType().getName());
            return 100; // No requirements = 100% complete
        }

        // Track missing documents
        List<String> missingDocs = new ArrayList<>();

        // For now, we'll do a simple count-based completeness
        // In a real system, you'd classify each document and match to requirements
        int requiredCount = requirements.size();
        int providedCount = documents.size();

        if (providedCount < requiredCount) {
            // Identify which specific requirements are missing
            for (DocumentRequirement req : requirements) {
                // This is simplified - in reality, you'd classify documents and match
                // categories
                missingDocs.add(req.getDisplayName());
            }
            // Limit to actual missing count
            int actuallyMissing = requiredCount - providedCount;
            missingDocs = missingDocs.subList(0, Math.min(actuallyMissing, missingDocs.size()));
        }

        // Store missing documents as JSON
        try {
            validationResult.setMissingDocuments(objectMapper.writeValueAsString(missingDocs));
        } catch (JsonProcessingException e) {
            logger.error("Error serializing missing documents", e);
            validationResult.setMissingDocuments("[]");
        }

        // Calculate score: (providedCount / requiredCount) * 100
        int score = Math.min(100, (providedCount * 100) / requiredCount);

        logger.debug("Completeness score: {} (provided: {}, required: {})", score, providedCount, requiredCount);
        return score;
    }

    /**
     * Analyze if documents are relevant to claim type
     */
    private int analyzeDocumentRelevance(List<ClaimDocument> documents, ClaimType claimType,
            EvidenceValidationResult validationResult) {
        logger.debug("Analyzing document relevance for claim type: {}", claimType.getName());

        if (documents.isEmpty()) {
            logger.warn("No documents to analyze");
            return 0;
        }

        try {
            // Classify each document and extract OCR data
            List<Map<String, Object>> classifiedDocs = new ArrayList<>();

            for (ClaimDocument doc : documents) {
                try {
                    // Call AI service to classify document
                    Map<String, Object> classification = classifyDocument(doc);

                    // Extract OCR fields
                    Map<String, Object> ocrData = extractOcrFromDocument(doc,
                            (String) classification.getOrDefault("documentType", "UNKNOWN"));

                    // Combine classification and OCR data
                    Map<String, Object> documentData = new HashMap<>();
                    documentData.put("documentType", classification.get("documentType"));
                    documentData.put("confidence", classification.get("confidence"));
                    documentData.put("extractedFields", ocrData.get("extractedFields"));

                    classifiedDocs.add(documentData);

                } catch (Exception e) {
                    logger.error("Error classifying document {}: {}", doc.getId(), e.getMessage());
                    // Add placeholder for failed classification
                    Map<String, Object> placeholderDoc = new HashMap<>();
                    placeholderDoc.put("documentType", "UNKNOWN");
                    placeholderDoc.put("confidence", 0);
                    placeholderDoc.put("extractedFields", new HashMap<>());
                    classifiedDocs.add(placeholderDoc);
                }
            }

            // Call AI service to analyze relevance
            Map<String, Object> relevanceRequest = new HashMap<>();
            relevanceRequest.put("claimType", claimType.getName());
            relevanceRequest.put("documents", classifiedDocs);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(relevanceRequest, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    AI_SERVICE_URL + "/api/analyze-relevance",
                    request,
                    Map.class);

            Map<String, Object> relevanceResult = response.getBody();

            if (relevanceResult != null && relevanceResult.containsKey("relevanceScore")) {
                int relevanceScore = ((Number) relevanceResult.get("relevanceScore")).intValue();

                // Store warnings
                List<String> warnings = (List<String>) relevanceResult.getOrDefault("warnings", new ArrayList<>());
                try {
                    validationResult.setWarnings(objectMapper.writeValueAsString(warnings));
                } catch (JsonProcessingException e) {
                    logger.error("Error serializing warnings", e);
                }

                logger.debug("Relevance score: {}", relevanceScore);
                return relevanceScore;
            }

            logger.warn("No relevance score in response");
            return 50; // Default neutral score

        } catch (Exception e) {
            logger.error("Error analyzing relevance: {}", e.getMessage(), e);
            return 50; // Default neutral score on error
        }
    }

    /**
     * Classify a document using AI service
     */
    private Map<String, Object> classifyDocument(ClaimDocument doc) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new FileSystemResource(doc.getFileUrl()));

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    AI_SERVICE_URL + "/api/classify-evidence",
                    request,
                    Map.class);

            return response.getBody();
        } catch (Exception e) {
            logger.error("Error classifying document: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("documentType", "UNKNOWN");
            fallback.put("confidence", 0);
            return fallback;
        }
    }

    /**
     * Extract OCR fields using AI service
     */
    private int extractOcrFields(List<ClaimDocument> documents,
            EvidenceValidationResult validationResult) {
        logger.debug("Extracting OCR fields from {} documents", documents.size());

        if (documents.isEmpty()) {
            return 100; // No documents = no OCR issues
        }

        try {
            Map<String, Object> allExtractedFields = new HashMap<>();
            int totalConfidence = 0;
            int docCount = 0;

            for (ClaimDocument doc : documents) {
                try {
                    Map<String, Object> ocrData = extractOcrFromDocument(doc, "UNKNOWN");

                    if (ocrData.containsKey("extractedFields")) {
                        allExtractedFields.put("document_" + doc.getId(), ocrData.get("extractedFields"));

                        if (ocrData.containsKey("confidence")) {
                            totalConfidence += ((Number) ocrData.get("confidence")).intValue();
                            docCount++;
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error extracting OCR from document {}: {}", doc.getId(), e.getMessage());
                }
            }

            // Store extracted fields
            try {
                validationResult.setExtractedFields(objectMapper.writeValueAsString(allExtractedFields));
            } catch (JsonProcessingException e) {
                logger.error("Error serializing extracted fields", e);
            }

            // Calculate average OCR confidence
            int avgScore = (docCount > 0) ? (totalConfidence / docCount) : 70;

            logger.debug("OCR consistency score: {}", avgScore);
            return avgScore;

        } catch (Exception e) {
            logger.error("Error extracting OCR fields: {}", e.getMessage(), e);
            return 70; // Default score on error
        }
    }

    /**
     * Extract OCR from a single document
     */
    private Map<String, Object> extractOcrFromDocument(ClaimDocument doc, String documentType) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new FileSystemResource(doc.getFileUrl()));
            body.add("document_type", documentType);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    AI_SERVICE_URL + "/api/extract-ocr",
                    request,
                    Map.class);

            return response.getBody();
        } catch (Exception e) {
            logger.error("Error extracting OCR: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("extractedFields", new HashMap<>());
            fallback.put("confidence", 50);
            return fallback;
        }
    }

    /**
     * Calculate overall validation score
     */
    private int calculateOverallScore(int completeness, int relevance, int ocr) {
        // Weighted average: completeness (40%), relevance (35%), OCR (25%)
        double score = (completeness * 0.40) + (relevance * 0.35) + (ocr * 0.25);
        return (int) Math.round(score);
    }

    /**
     * Determine validation status based on scores
     */
    private ValidationStatus determineStatus(int completeness, int relevance, int ocr,
            EvidenceValidationResult validationResult) {
        // Check for missing documents
        String missingDocs = validationResult.getMissingDocuments();
        if (missingDocs != null && !missingDocs.equals("[]") && !missingDocs.equals("null")) {
            return ValidationStatus.INCOMPLETE;
        }

        // Check for low relevance (inconsistent evidence)
        if (relevance < 60) {
            return ValidationStatus.INCONSISTENT;
        }

        // Check for low completeness
        if (completeness < 80) {
            return ValidationStatus.INCOMPLETE;
        }

        // All checks passed
        return ValidationStatus.COMPLETE;
    }

    /**
     * Determine workflow routing based on all scores
     */
    private WorkflowRoute determineWorkflowRoute(int completeness, int relevance,
            int ocr, int fraudScore) {
        logger.debug("Determining workflow route - Completeness: {}, Relevance: {}, OCR: {}, Fraud: {}",
                completeness, relevance, ocr, fraudScore);

        // RESUBMISSION: Missing required documents or severe type mismatch
        if (completeness < 60 || relevance < 60) {
            logger.info("Route: RESUBMISSION (low completeness or relevance)");
            return WorkflowRoute.RESUBMISSION;
        }

        // INVESTIGATION: High fraud or low completeness/relevance
        if (fraudScore >= 70 || completeness < 70 || relevance < 70) {
            logger.info("Route: INVESTIGATION (high fraud or medium-low scores)");
            return WorkflowRoute.INVESTIGATION;
        }

        // FAST_TRACK: Low fraud + Complete evidence + High relevance
        if (fraudScore < 30 && completeness >= 90 && relevance >= 80 && ocr >= 70) {
            logger.info("Route: FAST_TRACK (low fraud, complete evidence)");
            return WorkflowRoute.FAST_TRACK;
        }

        // STANDARD: Everything else (medium risk)
        logger.info("Route: STANDARD (default medium risk)");
        return WorkflowRoute.STANDARD;
    }

    /**
     * Get evidence validation result for a claim
     */
    public Optional<EvidenceValidationResult> getValidationResult(Long claimId) {
        return evidenceValidationResultRepository.findByClaimId(claimId);
    }
}
