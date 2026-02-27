# CAPSTONE PROJECT – ZEROTH REVIEW PRESENTATION
### 22CD603 | III CSD | Academic Year: 2025–2026 (Even Semester)
### Font: Times New Roman | Font Size: 20

---

---

## SLIDE 1 – TITLE SLIDE

---

# AI-Enabled Insurance Claim Management System for Fraud Prevention

---

| Field | Details |
|---|---|
| **Student Names** | \[Student Name 1\] – \[Register No.\] |
| | \[Student Name 2\] – \[Register No.\] |
| | \[Student Name 3\] – \[Register No.\] |
| | \[Student Name 4\] – \[Register No.\] |
| **Department** | Computer Science and Design (CSD) |
| **College** | \[College Name\] |
| **Guide Name** | \[Guide Name\], \[Designation\] |
| **Academic Year** | 2025–2026 (Even Semester) |

---

---

## SLIDE 2 – ABSTRACT

---

- Insurance fraud causes significant financial losses to insurance companies globally every year.
- This project presents an **AI-Enabled Insurance Claim Management System** integrated with automated fraud detection.
- Customers register, submit claims, and upload supporting documents through a secure web portal.
- An **AI service** analyzes uploaded images in real-time for tampering, deepfakes, and metadata anomalies.
- Claims receive a **Fraud Score (0–100)** classifying them as Genuine, Suspicious, or Fraudulent.
- Agents review fraud insights on a dedicated dashboard and make informed Approve/Reject decisions.
- The system uses **React.js** (frontend), **Spring Boot** (backend), and **Python FastAPI** (AI service).
- The result is a faster, transparent, and more accurate insurance claim processing workflow.

---

---

## SLIDE 3 – INTRODUCTION

---

### Background
- Insurance fraud is a multi-billion dollar problem affecting policyholders and companies alike.
- Manual claim verification is slow, inconsistent, and prone to human error.

### Domain / Field
- **Full-Stack Web Development** + **Artificial Intelligence** + **Computer Vision**

### Basic Idea Overview
- Build a **three-tier microservices system** (Frontend → Backend → AI Service).
- Automate the fraud detection step using **image analysis and metadata examination**.
- Provide role-based access: **Customer**, **Agent**, **Admin**.

---

---

## SLIDE 4 – PROBLEM STATEMENT

---

### What Problem Are We Solving?
- Insurance companies struggle to detect fraudulent claims submitted with **manipulated or AI-generated images**.

### Why Is It Important?
- Insurance fraud costs the industry **billions of dollars annually**.
- Fraudulent claims increase premiums for honest policyholders.

### Current Challenges
- Manual document review is **time-consuming** and error-prone.
- Lack of **automated tools** to detect deepfakes and image tampering.
- No **unified platform** for claim submission, document upload, and fraud analysis.
- Agents lack **data-driven insights** to support their decisions.

---

---

## SLIDE 5 – OBJECTIVES

---

### Main Goals of the Project
- Develop a **secure, role-based** insurance claim web application.
- Automate **fraud detection** using AI-powered image and metadata analysis.
- Provide agents with **real-time fraud scoring** to aid claim decisions.

### Expected Achievements
- **Improve accuracy** of fraud detection through heuristic and computer vision analysis.
- **Reduce manual work** for agents using AI insights and structured dashboards.
- **Increase efficiency** in claim processing from submission to final decision.
- Enable **one-time agent verification** of claim descriptions to ensure process integrity.
- Build a **scalable microservices architecture** for real-world deployment readiness.

---

---

## SLIDE 6 – EXISTING SYSTEM

---

### Current Methods / Technologies
- Traditional insurance claim systems rely on **manual document review** by staff.
- Basic web portals allow form submissions but have **no fraud detection capability**.

### How They Work
- Customer fills a paper/digital form and submits physical documents.
- Agents manually verify documents and approve or reject claims.
- No automated analysis of uploaded images or files.

### Limitations / Problems
- **No AI/ML integration** – unable to detect forged or deepfake images.
- **Slow processing** – manual review takes days or weeks.
- **Human bias** – inconsistent decisions across different agents.
- **No audit trail** – limited accountability and traceability.
- **High operational cost** due to large manual workforce requirement.

---

---

## SLIDE 7 – PROPOSED SYSTEM

---

### Our Project Idea
- An intelligent, full-stack **AI-Enabled Insurance Claim Management System**.

### How It Solves the Problem
- AI automatically analyzes uploaded documents for **tampering, deepfakes, and metadata anomalies**.
- Results are shown to agents as a clear **Fraud Score (0–100)** with indicators.
- Agents make decisions backed by **AI recommendations**, not intuition alone.

### Key Features
- **JWT-based Secure Authentication** with role-based access (Customer / Agent / Admin).
- **Real-time Fraud Detection** on document upload via Python AI microservice.
- **Agent Dashboard** with full claim details, fraud analysis card, and one-time description verification.
- **Customer Portal** for claim submission, status tracking, and document upload.
- **Audit Log** for full traceability of all system actions.

---

---

## SLIDE 8 – METHODOLOGY / WORKING PROCESS

---

### Step-by-Step Approach

1. **Customer Registers & Logs In** → Secure JWT token issued.
2. **Customer Submits Claim** → Fills claim form with policy number, amount, description, and claim type.
3. **Document Upload** → Customer uploads supporting evidence (images, PDFs).
4. **AI Analysis Triggered** → Backend sends images to Python AI service automatically.
5. **Fraud Score Generated** → AI returns score (0–100) with breakdown (deepfake, metadata, quality).
6. **Agent Reviews Claim** → Agent opens claim details with fraud analysis card.
7. **Description Verified Once** → Agent verifies claim description (one-time, non-repeatable action).
8. **Approve / Reject Decision** → Agent submits response; customer notified via dashboard.

---

---

## SLIDE 9 – SYSTEM ARCHITECTURE / BLOCK DIAGRAM

---

### System Architecture (3-Tier Microservices)

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                        │
│               React.js – Port 3000                        │
│    Login | Register | Dashboard | Claims | NewClaim       │
└─────────────────────┬────────────────────────────────────┘
                      │ REST API (Axios / HTTP)
┌─────────────────────▼────────────────────────────────────┐
│                    BACKEND LAYER                           │
│            Spring Boot (Java) – Port 8081                  │
│   AuthController | ClaimController | DocumentController    │
│   FraudController | ClaimService | FraudService            │
│   Spring Security (JWT) | Spring Data JPA | H2 Database    │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTP (REST Call to AI Service)
┌────────────────▼─────────────────────────────────────────┐
│                   AI SERVICE LAYER                         │
│            Python FastAPI – Port 5000                      │
│   fraud_detector | image_processor | metadata_analyzer     │
│   evidence_classifier | ocr_extractor                      │
│   Fraud Score: 0–29 (Genuine) | 30–69 (Suspicious)         │
│              70–100 (Fraudulent)                           │
└──────────────────────────────────────────────────────────┘
```

### Data Flow
- **Upload → Analyze → Score → Display → Decide**

---

---

## SLIDE 10 – TOOLS & TECHNOLOGIES

---

### Programming Languages
- **Java** – Backend business logic
- **JavaScript (ES6+)** – Frontend application
- **Python 3.8+** – AI fraud detection service

### Frameworks / Libraries
| Layer | Technology |
|---|---|
| Frontend | React.js, TailwindCSS, Axios, Lucide React |
| Backend | Spring Boot, Spring Security, Spring Data JPA |
| AI Service | FastAPI, OpenCV, Pillow, NumPy |

### Software Tools
- **Maven** – Java dependency management
- **npm** – Node package manager
- **H2 Database** – In-memory database (development)
- **MySQL / PostgreSQL** – Production database

### Hardware Components
- Standard development machine (No special hardware required)

---

---

## SLIDE 11 – FEASIBILITY STUDY

---

### Technical Feasibility
- All technologies (React, Spring Boot, FastAPI) are **open-source and widely supported**.
- AI fraud detection uses **heuristic-based image analysis** – no GPU required.
- System architecture is **modular** – each service can be developed and tested independently.

### Time Feasibility
| Phase | Timeline |
|---|---|
| Requirement Analysis & Design | Week 1–2 |
| Backend & Database Development | Week 3–5 |
| Frontend Development | Week 4–6 |
| AI Service Integration | Week 5–7 |
| Testing & Deployment | Week 8–10 |

### Resource Feasibility
- **Team**: 4 students with programming knowledge.
- **Tools**: All free/open-source.
- **Hardware**: Standard laptops (No cloud/GPU required).
- **Cost**: Minimal – only internet and hardware already available.

---

---

## SLIDE 12 – EXPECTED OUTCOMES

---

### Final Deliverables
- Fully functional **web application** with customer and agent portals.
- Integrated **AI fraud detection** service with real-time scoring.
- **Audit trail** for all claim actions and agent decisions.
- Complete **source code** with documentation.

### Benefits to Users
- **Customers** – Fast, transparent claim submission and real-time status tracking.
- **Agents** – AI-backed fraud insights for faster, more accurate decisions.
- **Insurance Companies** – Reduced losses from fraudulent claims.

### Future Impact
- Integrate **pre-trained deep learning models** (TensorFlow / PyTorch) for higher accuracy.
- Add **email/SMS notifications** for claim status updates.
- Implement **Blockchain-based audit trail** for tamper-proof records.
- Scale to a **cloud deployment** (AWS / Azure) for enterprise use.

---

---

## SLIDE 13 – REFERENCES

---

### Research Papers
1. Sundarkumar, G. G., & Ravi, V. (2015). *A novel hybrid undersampling method for mining unbalanced datasets in banking and insurance*. Engineering Applications of Artificial Intelligence.
2. Bhowmik, R. (2011). *Detecting Auto Insurance Fraud by Data Mining Techniques*. Journal of Emerging Trends in Computing and Information Sciences.
3. Bauder, R. A., & Khoshgoftaar, T. M. (2018). *Medicare fraud detection using machine learning methods*. IEEE ICTAI.

### Websites
- React Documentation: [https://reactjs.org](https://reactjs.org)
- Spring Boot Documentation: [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)
- FastAPI Documentation: [https://fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- OpenCV Documentation: [https://opencv.org](https://opencv.org)

### Books / Journals
- *Spring Boot in Action* – Craig Walls, Manning Publications.
- *Hands-On Machine Learning with Scikit-Learn & TensorFlow* – Aurélien Géron, O'Reilly.
- IEEE Transactions on Information Forensics and Security (TIFS) – Deepfake Detection Research.

---

---

## SLIDE 14 – THANK YOU

---

# Thank You!

---

> *"Fraud detection is not just a technology challenge — it is a commitment to fairness and integrity."*

---

### We welcome your Questions & Suggestions

---

**Project Title:** AI-Enabled Insurance Claim Management System for Fraud Prevention

**Course Code:** 22CD603 – Capstone Project

**Department of Computer Science and Design**

**Academic Year: 2025–2026 (Even Semester)**

---
