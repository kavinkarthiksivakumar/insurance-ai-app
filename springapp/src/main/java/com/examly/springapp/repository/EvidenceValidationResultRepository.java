package com.examly.springapp.repository;

import com.examly.springapp.model.EvidenceValidationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvidenceValidationResultRepository extends JpaRepository<EvidenceValidationResult, Long> {

    /**
     * Find evidence validation result by claim ID
     */
    Optional<EvidenceValidationResult> findByClaimId(Long claimId);

    /**
     * Check if evidence validation result exists for a claim
     */
    boolean existsByClaimId(Long claimId);
}
