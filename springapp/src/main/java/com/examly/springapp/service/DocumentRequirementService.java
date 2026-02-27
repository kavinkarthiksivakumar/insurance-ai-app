package com.examly.springapp.service;

import com.examly.springapp.model.ClaimType;
import com.examly.springapp.model.DocumentRequirement;
import com.examly.springapp.repository.ClaimTypeRepository;
import com.examly.springapp.repository.DocumentRequirementRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DocumentRequirementService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentRequirementService.class);

    @Autowired
    private DocumentRequirementRepository documentRequirementRepository;

    @Autowired
    private ClaimTypeRepository claimTypeRepository;

    /**
     * Get all document requirements for a specific claim type
     */
    public List<DocumentRequirement> getRequirementsForClaimType(Long claimTypeId) {
        return documentRequirementRepository.findByClaimTypeId(claimTypeId);
    }

    /**
     * Get only mandatory requirements for a claim type
     */
    public List<DocumentRequirement> getMandatoryRequirements(Long claimTypeId) {
        return documentRequirementRepository.findByClaimTypeIdAndMandatoryTrue(claimTypeId);
    }

    /**
     * Initialize default document requirements on application startup
     * This runs once when the application starts
     */
    @PostConstruct
    @Transactional
    public void initializeDefaultRequirements() {
        // Check if requirements already exist
        if (documentRequirementRepository.count() > 0) {
            logger.info("Document requirements already initialized. Skipping...");
            return;
        }

        logger.info("Initializing default document requirements...");

        // Get claim types
        List<ClaimType> claimTypes = claimTypeRepository.findAll();

        for (ClaimType claimType : claimTypes) {
            String typeName = claimType.getName().toUpperCase();

            if (typeName.contains("AUTO") || typeName.contains("VEHICLE")) {
                initializeAutoInsuranceRequirements(claimType);
            } else if (typeName.contains("HEALTH") || typeName.contains("MEDICAL")) {
                initializeHealthInsuranceRequirements(claimType);
            } else if (typeName.contains("HOME") || typeName.contains("PROPERTY")) {
                initializeHomeInsuranceRequirements(claimType);
            } else if (typeName.contains("LIFE")) {
                initializeLifeInsuranceRequirements(claimType);
            } else if (typeName.contains("TRAVEL")) {
                initializeTravelInsuranceRequirements(claimType);
            }
        }

        logger.info("Default document requirements initialized successfully.");
    }

    private void initializeAutoInsuranceRequirements(ClaimType claimType) {
        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "DAMAGE_PHOTO",
                "Vehicle Damage Photos",
                true,
                "Clear photographs showing vehicle damage from multiple angles"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "VEHICLE_RC",
                "Vehicle Registration Certificate",
                true,
                "Valid RC document proving vehicle ownership"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "REPAIR_ESTIMATE",
                "Repair Estimate/Invoice",
                true,
                "Garage estimate or repair invoice with itemized costs"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "POLICE_REPORT",
                "Police Report (FIR)",
                false,
                "Police report for major accidents or theft"));
    }

    private void initializeHealthInsuranceRequirements(ClaimType claimType) {
        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "HOSPITAL_BILL",
                "Hospital Bill/Invoice",
                true,
                "Detailed hospital bill with breakdown of charges"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "DISCHARGE_SUMMARY",
                "Discharge Summary",
                true,
                "Medical discharge summary from hospital"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "ID_DOCUMENT",
                "Identity Proof",
                true,
                "Valid government-issued ID (Aadhaar, PAN, etc.)"));
    }

    private void initializeHomeInsuranceRequirements(ClaimType claimType) {
        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "DAMAGE_PHOTO",
                "Property Damage Photos",
                true,
                "Clear photographs of damaged property"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "PROPERTY_DOCUMENT",
                "Property Ownership Proof",
                true,
                "Property deed or ownership documents"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "REPAIR_ESTIMATE",
                "Repair Estimate",
                true,
                "Contractor estimate for repairs"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "POLICE_REPORT",
                "Police Report",
                false,
                "Police report for theft or vandalism claims"));
    }

    private void initializeLifeInsuranceRequirements(ClaimType claimType) {
        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "ID_DOCUMENT",
                "Identity Proof",
                true,
                "Valid government-issued ID of beneficiary"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "HOSPITAL_BILL",
                "Medical Bills",
                false,
                "Hospital bills and medical reports if applicable"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "DISCHARGE_SUMMARY",
                "Medical Reports",
                false,
                "Detailed medical reports if applicable"));
    }

    private void initializeTravelInsuranceRequirements(ClaimType claimType) {
        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "ID_DOCUMENT",
                "Identity Proof and Passport",
                true,
                "Valid passport and ID documents"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "HOSPITAL_BILL",
                "Medical Bills (if applicable)",
                false,
                "Medical bills for health-related claims"));

        documentRequirementRepository.save(new DocumentRequirement(
                claimType,
                "DAMAGE_PHOTO",
                "Incident Photos",
                false,
                "Photos of damaged luggage or incident scene"));
    }
}
