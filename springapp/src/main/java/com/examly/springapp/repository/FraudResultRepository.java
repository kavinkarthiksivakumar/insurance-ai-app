package com.examly.springapp.repository;

import com.examly.springapp.model.FraudResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FraudResultRepository extends JpaRepository<FraudResult, Long> {

    /**
     * Find fraud result by claim ID
     */
    Optional<FraudResult> findByClaimId(Long claimId);

    /**
     * Find all suspicious or fraudulent claims
     */
    @Query("SELECT f FROM FraudResult f WHERE f.imageStatus IN ('SUSPICIOUS', 'FRAUD') ORDER BY f.fraudScore DESC")
    List<FraudResult> findSuspiciousClaims();

    /**
     * Find all claims with fraud score above threshold
     */
    @Query("SELECT f FROM FraudResult f WHERE f.fraudScore >= :threshold ORDER BY f.fraudScore DESC")
    List<FraudResult> findByFraudScoreGreaterThanEqual(int threshold);

    /**
     * Count total fraud results analyzed
     */
    long count();

    /**
     * Count suspicious claims
     */
    @Query("SELECT COUNT(f) FROM FraudResult f WHERE f.imageStatus = 'SUSPICIOUS'")
    long countSuspicious();

    /**
     * Count fraud claims
     */
    @Query("SELECT COUNT(f) FROM FraudResult f WHERE f.imageStatus = 'FRAUD'")
    long countFraud();
}
