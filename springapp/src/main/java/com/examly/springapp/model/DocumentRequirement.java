package com.examly.springapp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "document_requirements")
public class DocumentRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "claim_type_id", nullable = false)
    private ClaimType claimType;

    @Column(name = "document_category", nullable = false)
    private String documentCategory; // e.g., "DAMAGE_PHOTO", "HOSPITAL_BILL", "VEHICLE_RC"

    @Column(name = "display_name", nullable = false)
    private String displayName; // e.g., "Vehicle Damage Photos", "Hospital Bill"

    @Column(nullable = false)
    private Boolean mandatory; // Whether this document is required or optional

    @Column(columnDefinition = "TEXT")
    private String description; // Additional details about the requirement

    public DocumentRequirement() {
        this.mandatory = true; // Default to mandatory
    }

    public DocumentRequirement(ClaimType claimType, String documentCategory,
            String displayName, Boolean mandatory, String description) {
        this.claimType = claimType;
        this.documentCategory = documentCategory;
        this.displayName = displayName;
        this.mandatory = mandatory;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ClaimType getClaimType() {
        return claimType;
    }

    public void setClaimType(ClaimType claimType) {
        this.claimType = claimType;
    }

    public String getDocumentCategory() {
        return documentCategory;
    }

    public void setDocumentCategory(String documentCategory) {
        this.documentCategory = documentCategory;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Boolean getMandatory() {
        return mandatory;
    }

    public void setMandatory(Boolean mandatory) {
        this.mandatory = mandatory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
