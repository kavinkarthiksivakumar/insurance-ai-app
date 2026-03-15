# Project Architecture & Models

This document provides a detailed description and overall model delivery for every sector of the AI-Enabled Insurance Claim Management System.

## 1. System Architecture Overview

The project follows a modern 3-tier microservices architecture consisting of:
- **Frontend Layer (Presentation):** React.js
- **Backend Layer (Business Logic):** Spring Boot (Java)
- **AI Service Layer (Fraud Detection):** Python FastAPI

This separation of concerns ensures scalability, maintainability, and independent deployment of the distinct application components.

---

## 2. Frontend Layer (React.js)

The frontend is built as a Single Page Application (SPA) using **React.js**. It serves as the primary interface for both Customers and Agents.

### Key Models & Delivery

*   **Customer Portal:**
    *   **Dashboard & Claims View:** Allows customers to view the status of their submitted claims.
    *   **Claim Submission Module:** Provides a multipart form to submit new claims (Auto, Home, Health, etc.) along with descriptions and claim amounts.
    *   **Document Upload Module:** Handles the uploading of supporting document images. It communicates directly with the backend to securely transfer files.
*   **Agent Portal:**
    *   **Agent Dashboard:** A specialized view restricted to users with the `AGENT` role. It lists all system claims requiring review.
    *   **Fraud Analysis View:** A critical component that clearly displays the AI-generated Fraud Score (0-100) and specific indicators (Deepfake, Metadata tampering) to guide the agent's decision.
*   **State Management & Routing:**
    *   Uses React Context or Redux (if applicable) for global state management (e.g., user session, theme).
    *   Client-side routing ensures smooth transitions between pages without full page reloads.
*   **Security Delivery:**
    *   Stores and manages JWT tokens received from the backend upon successful login.
    *   Attaches the JWT token to the `Authorization` header for all subsequent API requests.

---

## 3. Backend Layer (Spring Boot)

The backend acts as the central hub, orchestrating data flow between the frontend, the database, and the external AI service. It is built using **Spring Boot** and **Java**.

### Key Models & Delivery

*   **Security & Authentication (Spring Security):**
    *   **Delivery:** Implements JWT-based stateless authentication. It verifies user credentials, generates tokens upon login, and validates tokens on every protected request.
    *   **Role-Based Access Control (RBAC):** Enforces access restrictions based on roles (`CUSTOMER`, `AGENT`, `ADMIN`) at the endpoint level.
*   **Data Models (Spring Data JPA):**
    *   `User`: Represents system users (Customers, Agents).
    *   `Claim`: Represents an insurance claim, containing policy details, amounts, status, and linked to a User.
    *   `ClaimDocument`: File metadata and storage path references for uploaded evidence.
    *   `FraudResult`: Stores the final output from the AI service (Score, Risk Level, Indicators) linked to a specific Claim.
*   **Controllers (REST APIs):**
    *   `AuthController`: Handles `/login` and `/register`.
    *   `ClaimController`: Handles CRUD operations for claims.
    *   `DocumentController`: Manages file uploads and serving files.
*   **AI Service Integration (Service Layer):**
    *   **Delivery:** When a document is uploaded, the backend service acts as an HTTP client, forwarding the image payload to the Python AI Service. It then parses the JSON response and persists the `FraudResult` to the database.

---

## 4. AI Service Layer (Python FastAPI)

This is a dedicated, independent microservice responsible purely for analyzing images and determining the likelihood of fraud. Built using **Python 3.8+** and **FastAPI**.

### Key Models & Delivery

*   **Image Processing Pipeline:**
    *   **Delivery:** Receives multipart image uploads from the Spring Boot backend. Uses libraries like **OpenCV** and **Pillow** to preprocess images (resizing, format normalization) before analysis.
*   **Fraud Detection Models:**
    *   **CNN + ViT Model:** Implements a hybrid approach using EfficientNet-B0 (for spatial features) and DeiT-Tiny (for global context/attention). This custom model is specifically trained for anomaly detection in images.
    *   **Heuristic Analysis:** Includes rule-based and algorithmic checks as well as machine learning.
    *   **Metadata Analyzer:** Extracts EXIF data from JPEGs to check for software signatures indicating manipulation (e.g., Photoshop) or inconsistencies in original capture dates.
    *   **Deepfake & Tampering Detection:** Scans for visual artifacts, noise inconsistencies, or error level analysis (ELA) that suggest the image is AI-generated or manipulated.
*   **Scoring Engine:**
    *   **Delivery:** Aggregates findings from various analyzers into a consolidated **Fraud Score (0-100)**.
    *   **Classification:**
        *   `0-29`: Genuine (Low Risk)
        *   `30-69`: Suspicious (Medium Risk)
        *   `70-100`: Fraudulent (High Risk)
*   **API Delivery (FastAPI):**
    *   Exposes a high-performance, asynchronous REST endpoint (typically `/analyze`) that strictly returns JSON formatted results containing the score and specific boolean flags for detected anomalies.

---

## 5. Database Layer (H2 / Relational DB)

The persistence layer stores all transactional data. Currently configured for **H2 (In-Memory/File-based)** for development, but structured for easy migration to MySQL/PostgreSQL in production.

### Key Models & Delivery

*   **Persistence Strategy:** Uses Spring Data JPA (Hibernate) to map Java objects (Entities) to relational database tables.
*   **Relational Delivery:** Maintains strict foreign key relationships (e.g., One User to Many Claims, One Claim to One FraudResult, One Claim to Many Documents) to ensure data integrity.
*   **Auditability:** Designed to support audit logs to track changes in claim status and agent decisions over time.
