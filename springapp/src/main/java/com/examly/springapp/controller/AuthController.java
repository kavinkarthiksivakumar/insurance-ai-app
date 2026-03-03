package com.examly.springapp.controller;

import com.examly.springapp.dto.AuthResponse;
import com.examly.springapp.dto.LoginRequest;
import com.examly.springapp.dto.RegisterRequest;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
     * Returns HTTP 401 Unauthorized for bad credentials.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
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
        } catch (org.springframework.security.core.AuthenticationException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * POST /api/auth/register
     *
     * PUBLIC endpoint — registers a new CUSTOMER account.
     *
     * SECURITY CONTRACT:
     * - Role is ALWAYS set to CUSTOMER. No client-supplied role is accepted.
     * - Passwords are BCrypt-hashed before storage. Plain-text never persisted.
     * - Duplicate email / phone / Aadhar → HTTP 409 Conflict.
     * - Invalid input (blank fields, short password, bad email) → HTTP 400 with
     * structured error map from @Valid.
     * - Password is never returned in any response.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {

        // ── Uniqueness checks → HTTP 409 Conflict (not 400) ─────────────────
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return conflict("email", "This email address is already registered.");
        }

        if (signUpRequest.getPhoneNumber() != null &&
                !signUpRequest.getPhoneNumber().isBlank() &&
                userRepository.existsByPhoneNumber(signUpRequest.getPhoneNumber())) {
            return conflict("phoneNumber", "This phone number is already registered to another user.");
        }

        if (signUpRequest.getAadharNumber() != null &&
                !signUpRequest.getAadharNumber().isBlank() &&
                userRepository.existsByAadharNumber(signUpRequest.getAadharNumber())) {
            return conflict("aadharNumber", "This Aadhar number is already registered to another user.");
        }

        // ── Build user — role is ALWAYS CUSTOMER, never from the request ─────
        User user = new User();
        user.setName(signUpRequest.getName().trim());
        user.setEmail(signUpRequest.getEmail().toLowerCase().trim());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setRole(User.UserRole.CUSTOMER); // ← HARDCODED — no role injection possible
        user.setPhoneNumber(signUpRequest.getPhoneNumber());
        user.setAadharNumber(signUpRequest.getAadharNumber());

        // Auto-generate unique policy number for new customers
        String datePart = java.time.format.DateTimeFormatter
                .ofPattern("yyyyMMdd")
                .format(java.time.LocalDate.now());
        String randomPart = String.format("%04d", new java.util.Random().nextInt(10000));
        user.setPolicyNumber("POL-" + datePart + "-" + randomPart);

        userRepository.save(user);

        // Return a structured success response (no password, no role that could be
        // confused)
        Map<String, String> response = new HashMap<>();
        response.put("message", "Registration successful! Please sign in.");
        response.put("email", user.getEmail());
        response.put("policyNumber", user.getPolicyNumber());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/auth/me
     * Returns the current authenticated user's profile from the JWT.
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

    /**
     * Handles @Valid validation failures from RegisterRequest — returns
     * HTTP 400 with a structured map of field → error message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(errors);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, String>> conflict(String field, String message) {
        Map<String, String> error = new HashMap<>();
        error.put("field", field);
        error.put("error", message);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
}
