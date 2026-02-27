package com.examly.springapp.controller;

import com.examly.springapp.dto.AuthResponse;
import com.examly.springapp.dto.LoginRequest;
import com.examly.springapp.dto.RegisterRequest;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    /**
     * POST /api/auth/login
     * Authenticates the user and returns a JWT token plus user profile.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User userDetails = (User) authentication.getPrincipal();

        return ResponseEntity.ok(new AuthResponse(
                jwt,
                userDetails.getRole().name(),
                userDetails.getEmail(),
                userDetails.getName(),
                userDetails.getPolicyNumber()));
    }

    /**
     * POST /api/auth/register
     * Registers a new user account. Validates uniqueness of email, phone, and
     * Aadhar.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Email is already in use!");
        }

        if (signUpRequest.getPhoneNumber() != null &&
                !signUpRequest.getPhoneNumber().isEmpty() &&
                userRepository.existsByPhoneNumber(signUpRequest.getPhoneNumber())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Phone number is already registered to another user!");
        }

        if (signUpRequest.getAadharNumber() != null &&
                !signUpRequest.getAadharNumber().isEmpty() &&
                userRepository.existsByAadharNumber(signUpRequest.getAadharNumber())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Aadhar number is already registered to another user!");
        }

        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setRole(signUpRequest.getRole());
        user.setPhoneNumber(signUpRequest.getPhoneNumber());
        user.setAadharNumber(signUpRequest.getAadharNumber());

        // Auto-generate policy number for customers
        if (signUpRequest.getRole() == User.UserRole.CUSTOMER) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String datePart = String.format("%04d%02d%02d",
                    now.getYear(), now.getMonthValue(), now.getDayOfMonth());
            String randomPart = String.format("%03d", new java.util.Random().nextInt(1000));
            user.setPolicyNumber("POL-" + datePart + randomPart);
        }

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }

    /**
     * GET /api/auth/me
     * Returns the current authenticated user's profile from the JWT.
     * The frontend calls this on page load to restore the active session.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }

        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(new AuthResponse(
                        null,
                        user.getRole().name(),
                        user.getEmail(),
                        user.getName(),
                        user.getPolicyNumber())))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
