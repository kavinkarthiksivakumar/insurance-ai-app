package com.examly.springapp.repository;

import com.examly.springapp.model.Claim;
import com.examly.springapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByCustomer(User customer);

    List<Claim> findByAssignedAgent(User agent);

    List<Claim> findByStatus(Claim.ClaimStatus status);
}
