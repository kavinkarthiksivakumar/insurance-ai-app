package com.examly.springapp.controller;

import com.examly.springapp.dto.ClaimRequest;
import com.examly.springapp.dto.ClaimStatusUpdateRequest;
import com.examly.springapp.model.Claim;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.service.ClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/claims")
public class ClaimController {
    @Autowired
    private ClaimService claimService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('AGENT')")
    public ResponseEntity<?> getAllClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submissionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String claimType,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount) {
        return ResponseEntity.ok(claimService.getAllClaimsWithFilters(
                page, size, sortBy, sortDir, status, claimType, minAmount, maxAmount));
    }

    /**
     * GET /api/claims/stats
     * Admin-only endpoint that returns aggregate stats across all claims and users.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminStats() {
        // Fetch all claims (unpaged) for stats computation
        List<Claim> allClaims = claimService.getAllClaimsUnpaged();

        long totalClaims = allClaims.size();
        double totalAmount = allClaims.stream().mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0).sum();

        // Claims by status
        Map<String, Long> byStatus = allClaims.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getStatus() != null ? c.getStatus().name() : "UNKNOWN",
                        Collectors.counting()));

        // Claims by type
        Map<String, Long> byType = allClaims.stream()
                .filter(c -> c.getClaimType() != null && c.getClaimType().getName() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getClaimType().getName(),
                        Collectors.counting()));

        // User stats
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long totalCustomers = allUsers.stream().filter(u -> u.getRole() == User.UserRole.CUSTOMER).count();
        long totalAgents = allUsers.stream().filter(u -> u.getRole() == User.UserRole.AGENT).count();
        long totalAdmins = allUsers.stream().filter(u -> u.getRole() == User.UserRole.ADMIN).count();

        // Recent claims (latest 5, sorted by submission date)
        List<Map<String, Object>> recentClaims = allClaims.stream()
                .sorted((a, b) -> {
                    if (a.getSubmissionDate() == null)
                        return 1;
                    if (b.getSubmissionDate() == null)
                        return -1;
                    return b.getSubmissionDate().compareTo(a.getSubmissionDate());
                })
                .limit(5)
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("policyNumber", c.getPolicyNumber());
                    m.put("status", c.getStatus() != null ? c.getStatus().name() : "UNKNOWN");
                    m.put("amount", c.getAmount());
                    m.put("claimType", c.getClaimType() != null ? c.getClaimType().getName() : "-");
                    m.put("submissionDate", c.getSubmissionDate() != null ? c.getSubmissionDate().toString() : "-");
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClaims", totalClaims);
        stats.put("totalAmount", totalAmount);
        stats.put("byStatus", byStatus);
        stats.put("byType", byType);
        stats.put("totalUsers", totalUsers);
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalAgents", totalAgents);
        stats.put("totalAdmins", totalAdmins);
        stats.put("recentClaims", recentClaims);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<Claim> getMyClaims() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return claimService.getMyClaims(email);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'AGENT', 'ADMIN')")
    public ResponseEntity<Claim> getClaimById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<?> getClaimDetails(@PathVariable("id") Long id) {
        return ResponseEntity.ok(claimService.getClaimDetails(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public Claim createClaim(@RequestBody ClaimRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return claimService.createClaim(request, email);
    }

    @PutMapping("/{id}/assign/{agentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Claim assignAgent(@PathVariable("id") Long id, @PathVariable("agentId") Long agentId) {
        return claimService.assignAgent(id, agentId);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('AGENT')")
    public Claim approveClaim(@PathVariable("id") Long id, @RequestBody ClaimStatusUpdateRequest request) {
        return claimService.updateStatusWithResponse(id, Claim.ClaimStatus.APPROVED, request.getResponse());
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('AGENT')")
    public Claim rejectClaim(@PathVariable("id") Long id, @RequestBody ClaimStatusUpdateRequest request) {
        return claimService.updateStatusWithResponse(id, Claim.ClaimStatus.REJECTED, request.getResponse());
    }

    @PutMapping("/{id}/verify-description")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<?> verifyDescription(@PathVariable("id") Long id) {
        Claim claim = claimService.getClaimById(id);
        if (claim.isDescriptionVerified()) {
            return ResponseEntity.status(409).body("Description has already been verified for this claim.");
        }
        return ResponseEntity.ok(claimService.verifyDescription(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> deleteClaim(@PathVariable("id") Long id) {
        claimService.deleteClaim(id);
        return ResponseEntity.ok("Claim deleted successfully");
    }
}
