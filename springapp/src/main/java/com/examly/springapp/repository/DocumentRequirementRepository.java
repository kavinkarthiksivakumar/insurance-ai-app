package com.examly.springapp.repository;

import com.examly.springapp.model.DocumentRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRequirementRepository extends JpaRepository<DocumentRequirement, Long> {

    /**
     * Find all document requirements for a specific claim type
     */
    List<DocumentRequirement> findByClaimTypeId(Long claimTypeId);

    /**
     * Find all mandatory document requirements for a claim type
     */
    List<DocumentRequirement> findByClaimTypeIdAndMandatoryTrue(Long claimTypeId);
}
