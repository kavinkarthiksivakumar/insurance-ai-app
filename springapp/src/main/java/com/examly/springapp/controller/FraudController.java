package com.examly.springapp.controller;

import com.examly.springapp.model.FraudResult;
import com.examly.springapp.model.ClaimDocument;
import com.examly.springapp.service.FraudService;
import com.examly.springapp.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/fraud")
public class FraudController {

    @Autowired
    private FraudService fraudService;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * MANUAL FRAUD DETECTION - Triggered by user clicking "Generate" button
     * Analyzes all images associated with a claim
     */
    @PostMapping("/analyze/{claimId}")
    public ResponseEntity<?> analyzeClaim(@PathVariable Long claimId) {
        try {
            // Get all documents for this claim
            List<ClaimDocument> documents = fileStorageService.getDocumentsByClaim(claimId);

            if (documents.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No documents found for this claim");
                error.put("analyzed", false);
                return ResponseEntity.badRequest().body(error);
            }

            // Analyze the first image document found
            ClaimDocument imageDoc = documents.stream()
                    .filter(doc -> doc.getFileType() != null && doc.getFileType().startsWith("image/"))
                    .findFirst()
                    .orElse(null);

            if (imageDoc == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No image documents found for fraud analysis");
                error.put("analyzed", false);
                return ResponseEntity.badRequest().body(error);
            }

            // Perform fraud analysis
            fileStorageService.analyzeFraudForDocument(imageDoc);

            // Fetch and return the results
            FraudResult fraudResult = fraudService.getFraudResultByClaim(claimId);

            if (fraudResult == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Fraud analysis failed - please try again");
                error.put("analyzed", false);
                return ResponseEntity.status(500).body(error);
            }

            return ResponseEntity.ok(fraudResult);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Fraud analysis failed: " + e.getMessage());
            error.put("analyzed", false);
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get fraud analysis results for a specific claim
     * Accessible by agents and admins
     */
    @GetMapping("/claim/{claimId}")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<?> getFraudResultByClaim(@PathVariable Long claimId) {
        FraudResult fraudResult = fraudService.getFraudResultByClaim(claimId);

        if (fraudResult == null) {
            return ResponseEntity.ok(createNoAnalysisResponse());
        }

        return ResponseEntity.ok(fraudResult);
    }

    /**
     * Get fraud statistics dashboard
     * Accessible by agents and admins only
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<FraudService.FraudStatistics> getFraudStatistics() {
        FraudService.FraudStatistics stats = fraudService.getFraudStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Check if AI fraud detection service is available
     */
    @GetMapping("/health")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> checkAiServiceHealth() {
        Map<String, Object> response = new HashMap<>();
        boolean available = fraudService.isAiServiceAvailable();
        response.put("aiServiceAvailable", available);
        response.put("status", available ? "operational" : "unavailable");
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createNoAnalysisResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("analyzed", false);
        response.put("message", "No fraud analysis performed for this claim yet");
        return response;
    }
}
