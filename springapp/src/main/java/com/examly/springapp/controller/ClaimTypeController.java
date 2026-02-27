package com.examly.springapp.controller;

import com.examly.springapp.model.ClaimType;
import com.examly.springapp.repository.ClaimTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/claim-types")
public class ClaimTypeController {
    @Autowired
    private ClaimTypeRepository claimTypeRepository;

    @GetMapping
    public List<ClaimType> getAllClaimTypes() {
        return claimTypeRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ClaimType createClaimType(@RequestBody ClaimType claimType) {
        return claimTypeRepository.save(claimType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteClaimType(@PathVariable Long id) {
        claimTypeRepository.deleteById(id);
    }
}
