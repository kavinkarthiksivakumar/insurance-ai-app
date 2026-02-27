package com.examly.springapp.controller;

import com.examly.springapp.dto.ClaimRequest;
import com.examly.springapp.dto.ClaimStatusUpdateRequest;
import com.examly.springapp.model.Claim;
import com.examly.springapp.service.ClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/claims")
public class ClaimController {
    @Autowired
    private ClaimService claimService;

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
