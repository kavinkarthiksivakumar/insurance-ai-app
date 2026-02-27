package com.examly.springapp.controller;

import com.examly.springapp.dto.DocumentRequirementDTO;
import com.examly.springapp.dto.EvidenceValidationResultDTO;
import com.examly.springapp.model.DocumentRequirement;
import com.examly.springapp.model.EvidenceValidationResult;
import com.examly.springapp.service.DocumentRequirementService;
import com.examly.springapp.service.EvidenceValidationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EvidenceValidationController {

    @Autowired
    private EvidenceValidationService evidenceValidationService;

    @Autowired
    private DocumentRequirementService documentRequirementService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get evidence validation result for a claim
     */
    @GetMapping("/claims/{claimId}/evidence-validation")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<EvidenceValidationResultDTO> getEvidenceValidation(@PathVariable("claimId") Long claimId) {
        try {
            EvidenceValidationResult result = evidenceValidationService.getValidationResult(claimId)
                    .orElseThrow(
                            () -> new RuntimeException("Evidence validation result not found for claim: " + claimId));

            EvidenceValidationResultDTO dto = convertToDTO(result);
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }
    }

    /**
     * Re-run evidence validation for a claim
     */
    @PostMapping("/claims/{claimId}/evidence-validation/revalidate")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<EvidenceValidationResultDTO> revalidateEvidence(@PathVariable("claimId") Long claimId) {
        try {
            EvidenceValidationResult result = evidenceValidationService.validateClaimEvidence(claimId);
            EvidenceValidationResultDTO dto = convertToDTO(result);
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Get document requirements for a claim type
     */
    @GetMapping("/claim-types/{typeId}/requirements")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<List<DocumentRequirementDTO>> getDocumentRequirements(@PathVariable("typeId") Long typeId) {
        try {
            List<DocumentRequirement> requirements = documentRequirementService.getRequirementsForClaimType(typeId);

            List<DocumentRequirementDTO> dtos = requirements.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ArrayList<>());
        }
    }

    /**
     * Convert EvidenceValidationResult to DTO
     */
    private EvidenceValidationResultDTO convertToDTO(EvidenceValidationResult result) {
        EvidenceValidationResultDTO dto = new EvidenceValidationResultDTO();

        dto.setId(result.getId());
        dto.setClaimId(result.getClaim().getId());
        dto.setCompletenessScore(result.getCompletenessScore());
        dto.setRelevanceScore(result.getRelevanceScore());
        dto.setOcrConsistencyScore(result.getOcrConsistencyScore());
        dto.setOverallScore(result.getOverallScore());
        dto.setStatus(result.getStatus());
        dto.setValidationDate(result.getValidationDate());
        dto.setRecommendedRoute(result.getRecommendedRoute());

        // Parse JSON strings
        try {
            if (result.getMissingDocuments() != null) {
                List<String> missingDocs = objectMapper.readValue(
                        result.getMissingDocuments(),
                        new TypeReference<List<String>>() {
                        });
                dto.setMissingDocuments(missingDocs);
            } else {
                dto.setMissingDocuments(new ArrayList<>());
            }

            if (result.getWarnings() != null) {
                List<String> warnings = objectMapper.readValue(
                        result.getWarnings(),
                        new TypeReference<List<String>>() {
                        });
                dto.setWarnings(warnings);
            } else {
                dto.setWarnings(new ArrayList<>());
            }

            if (result.getExtractedFields() != null) {
                Map<String, Object> fields = objectMapper.readValue(
                        result.getExtractedFields(),
                        new TypeReference<Map<String, Object>>() {
                        });
                dto.setExtractedFields(fields);
            } else {
                dto.setExtractedFields(new HashMap<>());
            }

        } catch (Exception e) {
            // Set defaults if parsing fails
            dto.setMissingDocuments(new ArrayList<>());
            dto.setWarnings(new ArrayList<>());
            dto.setExtractedFields(new HashMap<>());
        }

        return dto;
    }

    /**
     * Convert DocumentRequirement to DTO
     */
    private DocumentRequirementDTO convertToDTO(DocumentRequirement requirement) {
        DocumentRequirementDTO dto = new DocumentRequirementDTO();

        dto.setId(requirement.getId());
        dto.setClaimTypeId(requirement.getClaimType().getId());
        dto.setClaimTypeName(requirement.getClaimType().getName());
        dto.setDocumentCategory(requirement.getDocumentCategory());
        dto.setDisplayName(requirement.getDisplayName());
        dto.setMandatory(requirement.getMandatory());
        dto.setDescription(requirement.getDescription());

        return dto;
    }
}
