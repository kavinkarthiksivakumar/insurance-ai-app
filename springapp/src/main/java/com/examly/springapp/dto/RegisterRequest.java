package com.examly.springapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for public user registration.
 *
 * SECURITY RULES:
 *  - Role is intentionally ABSENT. The backend always assigns CUSTOMER.
 *    Frontend must never send a role field; any role sent is silently ignored.
 *  - Password is validated server-side (min 8 chars) before BCrypt hashing.
 *  - Email and phone uniqueness are enforced in AuthController (HTTP 409).
 */
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @Pattern(
        regexp = "^(\\+\\d{1,4}\\d{7,12})?$",
        message = "Phone number must be in international format (e.g. +919876543210) or left blank"
    )
    private String phoneNumber;

    @Pattern(
        regexp = "^\\d{12}$",
        message = "Aadhar number must be exactly 12 digits"
    )
    private String aadharNumber;

    // ── Getters / Setters ────────────────────────────────────────────────────

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }
}

