# AI Fraud Detection Service

This directory contains the Python-based AI service for automated fraud detection in insurance claim images.

## Overview

The fraud detection service analyzes uploaded images for potential fraud indicators including:
- Image quality and authenticity checks
- Metadata tampering detection (EXIF data)
- Deepfake and AI-generated image detection (heuristic-based)
- File manipulation indicators

## Architecture

```
ai-service/
├── app.py                 # FastAPI application entry point
├── fraud_detector.py      # Core fraud detection logic
├── image_processor.py     # Image preprocessing and validation
├── metadata_analyzer.py   # EXIF metadata analysis
├── models/                # Directory for ML model files
├── temp_uploads/          # Temporary storage for analysis (auto-created)
└── requirements.txt       # Python dependencies
```

## Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the AI service directory:**
   ```bash
   cd ai-service
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # Activate on Windows
   venv\Scripts\activate
   
   # Activate on Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

Start the fraud detection API server:

```bash
python app.py
```

The service will be available at:
- **API Endpoint**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs (Swagger UI)
- **Health Check**: http://localhost:5000/health

## API Endpoints

### POST /api/analyze
Analyzes an uploaded image for fraud indicators.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Parameter: `image` (file)

**Response:**
```json
{
  "imageStatus": "GENUINE|SUSPICIOUS|FRAUD",
  "fraudScore": 0-100,
  "confidence": 0-100,
  "remarks": "Detailed analysis summary",
  "details": {
    "imageQuality": "good|medium|poor",
    "metadataFlags": ["flag1", "flag2"],
    "detectionMethod": "heuristic-v1",
    "analysisTimestamp": "2026-01-29T...",
    "warnings": []
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "fraud-detection-ai",
  "components": {
    "fraud_detector": "operational",
    "image_processor": "operational",
    "metadata_analyzer": "operational"
  }
}
```

## Fraud Scoring System

The service calculates a fraud score from 0-100:

- **0-29**: GENUINE - Low risk, image appears authentic
- **30-69**: SUSPICIOUS - Medium risk, requires additional verification
- **70-100**: FRAUD - High risk, likely fraudulent

Factors considered:
- Image quality (blur, resolution, compression)
- Metadata tampering (edited EXIF data, missing camera info)
- File characteristics (unusual compression ratios)
- Photo editing software signatures
- AI-generated image indicators

## Current Implementation

The current version uses **heuristic-based fraud detection** which analyzes:
1. Image quality metrics (sharpness, blur levels)
2. EXIF metadata tampering
3. File editing signatures
4. Basic deepfake indicators

## Future Enhancements

To integrate real machine learning models:

1. **Train or obtain a deepfake detection model** (e.g., using TensorFlow, PyTorch)
2. **Place model files** in the `models/` directory
3. **Update `fraud_detector.py`** to load and use the ML model:
   ```python
   import tensorflow as tf
   
   class FraudDetector:
       def __init__(self):
           self.model = tf.keras.models.load_model('models/deepfake_model.h5')
   ```
4. **Add model dependencies** to `requirements.txt`

### Recommended Models
- **MesoNet**: Specialized deepfake detection
- **XceptionNet**: Transfer learning for fake detection
- **EfficientNet-based**: Image manipulation detection

## Troubleshooting

### Port Already in Use
If port 5000 is occupied:
```python
# In app.py, change the port:
uvicorn.run(app, host="0.0.0.0", port=5001)
```

Also update `application.properties` in Spring Boot:
```properties
ai.service.url=http://localhost:5001
```

### Import Errors
Ensure all dependencies are installed:
```bash
pip install --upgrade -r requirements.txt
```

### Windows python-magic Error
If you encounter errors with `python-magic-bin`, try:
```bash
pip uninstall python-magic python-magic-bin
pip install python-magic-bin==0.4.14
```

## Integration with Backend

The Spring Boot backend automatically calls this service when documents are uploaded:
1. Customer uploads claim document (image)
2. DocumentController triggers fraud analysis
3. FileStorageService calls `/api/analyze`
4. Results saved to `fraud_results` database table
5. Agents view fraud analysis when reviewing claims

## Performance

- Average analysis time: ~500ms per image
- Supports concurrent requests
- Automatically cleans up temporary files

## Security Notes

- Service should be run in a trusted network environment
- Consider adding API authentication for production
- Implement rate limiting for public-facing deployments

---

For questions or issues, refer to the main project documentation.
