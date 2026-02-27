package com.examly.springapp.dto;

public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role;
    private String email;
    private String name;
    private String policyNumber;

    public AuthResponse(String accessToken, String role, String email, String name) {
        this.accessToken = accessToken;
        this.role = role;
        this.email = email;
        this.name = name;
    }

    public AuthResponse(String accessToken, String role, String email, String name, String policyNumber) {
        this.accessToken = accessToken;
        this.role = role;
        this.email = email;
        this.name = name;
        this.policyNumber = policyNumber;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }
}
