# AI-Enabled Insurance Claim Management System for Fraud Prevention  

An intelligent insurance claim processing system with integrated AI-powered fraud detection capabilities. Built using modern web technologies and microservices architecture.

## 🌟 Key Features

### Core Functionality
- **User Authentication & Authorization** - Secure JWT-based authentication with role-based access control
- **Claim Management** - Complete claim lifecycle from submission to approval/rejection
- **Document Upload** - Support for multiple document uploads per claim
- **Agent Dashboard** - Comprehensive claim review and management interface
- **Customer Portal** - User-friendly claim submission and status tracking

### 🤖 AI Fraud Detection (NEW!)
- **Automatic Image Analysis** - Real-time fraud detection on image upload
- **Deepfake Detection** - Heuristic-based AI-generated image identification
- **Metadata Tampering** - EXIF data analysis for image manipulation
- **Fraud Scoring** - Intelligent 0-100 fraud probability scoring
- **Agent Insights** - Visual fraud indicators and recommendations

## 🏗️ Technology Stack

### Frontend
- **React.js** - Modern UI with hooks and context
- **TailwindCSS** - Utility-first styling
- **Axios** - HTTP client for API communication
- **Lucide React** - Beautiful icon library

### Backend
- **Spring Boot** - Robust Java backend framework
- **Spring Security** - JWT authentication and authorization
- **Spring Data JPA** - Database abstraction layer
- **H2 Database** - In-memory database (dev) / production-ready for MySQL/PostgreSQL

### AI Service
- **Python 3.8+** - AI service runtime
- **FastAPI** - High-performance async web framework
- **OpenCV** - Image processing and computer vision
- **Pillow** - Python imaging library
- **NumPy** - Numerical computing

## 📁 Project Structure

```
ai-insurance-claim-fraud-prevention/
│
├── ai-service/                    # Python AI Fraud Detection Service
│   ├── app.py                     # FastAPI application
│   ├── fraud_detector.py          # Core fraud detection logic
│   ├── image_processor.py         # Image preprocessing
│   ├── metadata_analyzer.py       # EXIF metadata analysis
│   ├── models/                    # ML model storage (placeholder)
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # AI service documentation
│
├── springapp/                     # Spring Boot Backend
│   └── src/main/java/com/examly/springapp/
│       ├── controller/            # REST API controllers
│       │   ├── AuthController.java
│       │   ├── ClaimController.java
│       │   ├── DocumentController.java
│       │   └── FraudController.java
│       ├── service/               # Business logic layer
│       │   ├── ClaimService.java
│       │   ├── FraudService.java
│       │   └── FileStorageService.java
│       ├── model/                 # JPA entities
│       │   ├── User.java
│       │   ├── Claim.java
│       │   ├── FraudResult.java
│       │   └── ClaimDocument.java
│       ├── repository/            # Data access layer
│       ├── security/              # Security configuration
│       └── dto/                   # Data transfer objects
│
├── src/                           # React Frontend
│   ├── components/                # Reusable components
│   │   ├── FraudAnalysisCard.jsx  # Fraud display component
│   │   ├── Header.jsx
│   │   └── PrivateRoute.jsx
│   ├── pages/                     # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Claims.jsx
│   │   └── NewClaim.jsx
│   ├── api/                       # API client modules
│   │   ├── claimsApi.js
│   │   ├── fraudApi.js
│   │   └── documentsApi.js
│   └── context/                   # React context providers
│
└── docs/                          # Project documentation
    ├── QUICK_START.md             # Setup and run guide
    └── AI_FRAUD_DETECTION.md      # Fraud detection technical docs
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 16+ and npm
- Python 3.8+
- Maven

### Running the System

**1. Start AI Fraud Detection Service:**
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```
✅ Running at http://localhost:5000

**2. Start Spring Boot Backend:**
```bash
cd springapp
./mvnw spring-boot:run
```
✅ Running at http://localhost:8081

**3. Start React Frontend:**
```bash
npm install
npm start
```
✅ Running at http://localhost:3000

📖 **Detailed setup guide:** See `QUICK_START.md`

## 🎯 How It Works

### Fraud Detection Workflow

1. **Customer uploads claim** with supporting images
2. **Backend receives upload** → Saves to file storage
3. **Fraud analysis triggered** → Image sent to AI service
4. **AI service analyzes:**
   - Image quality and authenticity
   - EXIF metadata for tampering
   - Editing software signatures
   - Deepfake indicators
5. **Fraud score calculated** (0-100)
6. **Results stored** in database linked to claim
7. **Agent reviews claim** with fraud insights visible
8. **Decision made** with AI recommendations

### Fraud Scoring

- **0-29 (GENUINE)**: Low risk, standard approval process
- **30-69 (SUSPICIOUS)**: Medium risk, additional verification recommended
- **70-100 (FRAUD)**: High risk, thorough investigation required

## 📊 Database Schema

### Key Tables
- **users** - Customer and agent accounts
- **claims** - Insurance claim records
- **claim_documents** - Document metadata and storage references
- **fraud_results** - AI fraud analysis results
- **claim_types** - Claim categories (Auto, Home, Health, etc.)
- **audit_logs** - System activity tracking

## 🔐 Security

- JWT token-based authentication
- Role-based authorization (CUSTOMER, AGENT, ADMIN)
- Secure password hashing (BCrypt)
- CORS configuration for frontend-backend communication
- Protected API endpoints with Spring Security

## 🎓 For Viva/Project Demonstration

### Key Discussion Points

**1. System Architecture**
- Microservices design with independent AI service
- RESTful API communication
- Frontend-backend separation

**2. AI Integration**
- Current: Heuristic-based fraud detection
- Future: ML model integration (TensorFlow/PyTorch)
- Scalability: Independent AI service can be scaled separately

**3. Technology Justification**
- React: Component-based UI for maintainability
- Spring Boot: Enterprise-grade Java framework
- FastAPI: High-performance Python for AI workloads
- H2: Quick dev setup, production-ready for MySQL/PostgreSQL

**4. Real-World Applications**
- Insurance fraud costs billions annually
- AI reduces manual review time
- Improves claim processing accuracy

### Demo Flow

1. **Show registration and login**
2. **Customer submits claim** with edited image
3. **Navigate to agent view**
4. **Display fraud analysis card** with high score
5. **Submit another claim** with genuine image
6. **Show low fraud score**
7. **Explain the scoring factors**

## 🔮 Future Enhancements

- [ ] Integrate pre-trained deepfake detection models
- [ ] Real-time dashboard with fraud analytics
- [ ] Email notifications for claim status updates
- [ ] Mobile responsive design improvements
- [ ] Advanced reporting and statistics
- [ ] Blockchain integration for immutable audit trail
- [ ] Integration with external fraud databases

## 📝 API Documentation

- **AI Service API Docs**: http://localhost:5000/docs (Swagger UI)
- **Backend Health**: http://localhost:8081/actuator/health
- **H2 Console**: http://localhost:8081/h2-console

## 🐛 Troubleshooting

See `QUICK_START.md` for common issues and solutions.

## 📖 Additional Documentation

- `ai-service/README.md` - AI service detailed documentation
- `QUICK_START.md` - Complete setup and running guide
- `docs/` - Additional project documentation

## 👥 Contributors

Developed as an academic project demonstrating:
- Full-stack development skills
- AI/ML integration
- Microservices architecture
- Modern web technology stack

## 📄 License

This project is developed for educational purposes.

---

**Ready to run?** Start with `QUICK_START.md`! 🚀
