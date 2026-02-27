package com.examly.springapp.service;

import com.examly.springapp.dto.ClaimRequest;
import com.examly.springapp.model.Claim;
import com.examly.springapp.model.ClaimType;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.ClaimRepository;
import com.examly.springapp.repository.ClaimTypeRepository;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.AuditLogRepository;
import com.examly.springapp.repository.ClaimDocumentRepository;
import com.examly.springapp.model.AuditLog;
import com.examly.springapp.model.ClaimDocument;
import com.examly.springapp.dto.ClaimDetailsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClaimService {
    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimTypeRepository claimTypeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ClaimDocumentRepository claimDocumentRepository;

    // TODO: Re-enable after fixing compilation issues
    // @Autowired
    // private EvidenceValidationService evidenceValidationService;

    // Temporarily disabled - method doesn't exist
    // @Autowired
    // private FraudService fraudService;

    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    public Map<String, Object> getAllClaimsWithFilters(
            int page, int size, String sortBy, String sortDir,
            String status, String claimType, Double minAmount, Double maxAmount) {

        // Create sort
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        // Create pageable
        Pageable pageable = PageRequest.of(page, size, sort);

        // Get all claims
        List<Claim> allClaims = claimRepository.findAll(sort);

        // Apply filters
        List<Claim> filteredClaims = allClaims.stream()
                .filter(claim -> status == null || claim.getStatus().toString().equalsIgnoreCase(status))
                .filter(claim -> claimType == null ||
                        (claim.getClaimType() != null && claim.getClaimType().getName().equalsIgnoreCase(claimType)))
                .filter(claim -> minAmount == null || claim.getAmount() >= minAmount)
                .filter(claim -> maxAmount == null || claim.getAmount() <= maxAmount)
                .collect(Collectors.toList());

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredClaims.size());
        List<Claim> paginatedClaims = start < filteredClaims.size()
                ? filteredClaims.subList(start, end)
                : List.of();

        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("claims", paginatedClaims);
        response.put("currentPage", page);
        response.put("totalItems", filteredClaims.size());
        response.put("totalPages", (int) Math.ceil((double) filteredClaims.size() / size));

        return response;
    }

    public List<Claim> getMyClaims(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return claimRepository.findByCustomer(user);
    }

    public Claim getClaimById(Long id) {
        return claimRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Claim not found"));
    }

    public ClaimDetailsDTO getClaimDetails(Long id) {
        Claim claim = getClaimById(id);

        ClaimDetailsDTO dto = new ClaimDetailsDTO();
        dto.setId(claim.getId());
        dto.setPolicyNumber(claim.getPolicyNumber());
        dto.setAmount(claim.getAmount());
        dto.setDescription(claim.getDescription());
        dto.setStatus(claim.getStatus());
        dto.setSubmissionDate(claim.getSubmissionDate());
        dto.setAgentResponse(claim.getAgentResponse());
        dto.setDescriptionVerified(claim.isDescriptionVerified());

        // Claim Type
        if (claim.getClaimType() != null) {
            dto.setClaimTypeId(claim.getClaimType().getId());
            dto.setClaimTypeName(claim.getClaimType().getName());
        }

        // Customer Information
        if (claim.getCustomer() != null) {
            User customer = claim.getCustomer();
            dto.setCustomerId(customer.getId());
            dto.setCustomerName(customer.getName());
            dto.setCustomerEmail(customer.getEmail());
            dto.setCustomerPhone(customer.getPhoneNumber());
            dto.setCustomerAadhar(customer.getAadharNumber());
            dto.setCustomerPolicyNumber(customer.getPolicyNumber());
        }

        // Assigned Agent
        if (claim.getAssignedAgent() != null) {
            dto.setAssignedAgentId(claim.getAssignedAgent().getId());
            dto.setAssignedAgentName(claim.getAssignedAgent().getName());
        }

        // Documents
        List<ClaimDocument> documents = claimDocumentRepository.findByClaimId(id);
        dto.setDocuments(documents);

        return dto;
    }

    public Claim createClaim(ClaimRequest request, String userEmail) {
        User customer = userRepository.findByEmail(userEmail).orElseThrow();

        // Check if the policy number matches the current user's policy number
        if (request.getPolicyNumber() != null && !request.getPolicyNumber().isEmpty()) {
            // Check if this policy number belongs to a different user
            Optional<User> policyOwner = userRepository.findByPolicyNumber(request.getPolicyNumber());

            if (policyOwner.isPresent() && !policyOwner.get().getId().equals(customer.getId())) {
                throw new RuntimeException(
                        "This policy number is already registered to another user. Please use your own policy number.");
            }

            // If the policy number doesn't exist or belongs to the current user, that's
            // fine
            // But if it doesn't match the user's registered policy number, warn them
            if (customer.getPolicyNumber() != null &&
                    !customer.getPolicyNumber().isEmpty() &&
                    !request.getPolicyNumber().equals(customer.getPolicyNumber())) {
                throw new RuntimeException(
                        "The policy number you entered does not match your registered policy number: "
                                + customer.getPolicyNumber());
            }
        }

        ClaimType type = claimTypeRepository.findById(request.getClaimTypeId())
                .orElseThrow(() -> new NoSuchElementException("Claim Type not found"));

        Claim claim = new Claim();
        claim.setCustomer(customer);
        claim.setClaimType(type);
        claim.setDescription(request.getDescription());
        claim.setPolicyNumber(request.getPolicyNumber());
        claim.setAmount(request.getAmount());

        Claim savedClaim = claimRepository.save(claim);
        logAction(savedClaim, customer, "CLAIM_SUBMITTED");

        // Trigger fraud analysis (done asynchronously after documents are uploaded)
        // This will be called by DocumentController after documents are uploaded

        // Note: Evidence validation will be triggered AFTER documents are uploaded
        // See DocumentController.uploadDocument for the trigger point

        return savedClaim;
    }

    public Claim assignAgent(Long claimId, Long agentId) {
        Claim claim = getClaimById(claimId);
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new NoSuchElementException("Agent not found"));

        claim.setAssignedAgent(agent);
        claim.setStatus(Claim.ClaimStatus.IN_REVIEW);
        Claim savedClaim = claimRepository.save(claim);

        logAction(savedClaim, getCurrentUser(), "ASSIGNED_TO_" + agent.getName());
        return savedClaim;
    }

    public Claim updateStatus(Long claimId, Claim.ClaimStatus status) {
        Claim claim = getClaimById(claimId);
        claim.setStatus(status);
        Claim savedClaim = claimRepository.save(claim);

        logAction(savedClaim, getCurrentUser(), "STATUS_CHANGED_TO_" + status);
        return savedClaim;
    }

    public Claim updateStatusWithResponse(Long claimId, Claim.ClaimStatus status, String response) {
        Claim claim = getClaimById(claimId);
        claim.setStatus(status);
        claim.setAgentResponse(response);
        Claim savedClaim = claimRepository.save(claim);

        logAction(savedClaim, getCurrentUser(), "STATUS_CHANGED_TO_" + status + "_WITH_RESPONSE");
        return savedClaim;
    }

    public Claim verifyDescription(Long claimId) {
        Claim claim = getClaimById(claimId);
        if (!claim.isDescriptionVerified()) {
            claim.setDescriptionVerified(true);
            Claim savedClaim = claimRepository.save(claim);
            logAction(savedClaim, getCurrentUser(), "DESCRIPTION_VERIFIED");
            return savedClaim;
        }
        return claim; // Already verified — idempotent, no re-save
    }

    public void deleteClaim(Long claimId) {
        Claim claim = getClaimById(claimId);
        // Delete audit logs first (referential integrity — AuditLog FK points to
        // claims)
        java.util.List<com.examly.springapp.model.AuditLog> logs = auditLogRepository.findByClaimId(claimId);
        auditLogRepository.deleteAll(logs);
        // Delete associated documents
        java.util.List<com.examly.springapp.model.ClaimDocument> docs = claimDocumentRepository.findByClaimId(claimId);
        claimDocumentRepository.deleteAll(docs);
        // Now safe to delete the claim
        claimRepository.delete(claim);
    }

    private void logAction(Claim claim, User user, String action) {
        AuditLog log = new AuditLog(claim, user, action);
        auditLogRepository.save(log);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
