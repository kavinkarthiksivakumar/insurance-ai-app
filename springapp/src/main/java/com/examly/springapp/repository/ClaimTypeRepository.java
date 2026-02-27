package com.examly.springapp.repository;

import com.examly.springapp.model.ClaimType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimTypeRepository extends JpaRepository<ClaimType, Long> {
}
