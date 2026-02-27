package com.examly.springapp.controller;

import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/users
     * Returns all users. Restricted to ADMIN and AGENT roles.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(this::toSafeMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/users/{id}
     * Returns a single user by ID. Restricted to ADMIN and AGENT roles.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<?> getUserById(@PathVariable("id") Long id) {
        return userRepository.findById(id)
                .map(user -> (ResponseEntity<?>) ResponseEntity.ok(toSafeMap(user)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * GET /api/users/customers
     * Returns only CUSTOMER-role users. Restricted to ADMIN and AGENT roles.
     */
    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<List<Map<String, Object>>> getCustomers() {
        List<Map<String, Object>> customers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.UserRole.CUSTOMER)
                .map(this::toSafeMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(customers);
    }

    /**
     * Maps a User entity to a safe representation (no password field).
     */
    private Map<String, Object> toSafeMap(User user) {
        Long id = user.getId();
        return Map.of(
                "id", id != null ? id : 0L,
                "name", user.getName() != null ? user.getName() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "role", user.getRole().name(),
                "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
                "policyNumber", user.getPolicyNumber() != null ? user.getPolicyNumber() : "",
                "aadharNumber", user.getAadharNumber() != null ? user.getAadharNumber() : "");
    }
}
