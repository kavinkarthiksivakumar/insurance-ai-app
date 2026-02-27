from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import shutil
from pathlib import Path
from fraud_detector import FraudDetector
from image_processor import ImageProcessor
from metadata_analyzer import MetadataAnalyzer
from evidence_classifier import EvidenceClassifier
from ocr_extractor import OcrExtractor
from relevance_analyzer import RelevanceAnalyzer

app = FastAPI(title="Insurance Fraud Detection AI Service", version="1.0.0")

# CORS configuration - allow Spring Boot backend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
fraud_detector = FraudDetector()
image_processor = ImageProcessor()
metadata_analyzer = MetadataAnalyzer()
evidence_classifier = EvidenceClassifier()
ocr_extractor = OcrExtractor()
relevance_analyzer = RelevanceAnalyzer()

# Temporary storage for uploaded files
UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Insurance Fraud Detection AI",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "fraud-detection-ai",
        "components": {
            "fraud_detector": "operational",
            "image_processor": "operational",
            "metadata_analyzer": "operational",
            "evidence_classifier": "operational",
            "ocr_extractor": "operational",
            "relevance_analyzer": "operational"
        }
    }


@app.post("/api/analyze")
async def analyze_image(image: UploadFile = File(...)):
    """
    Analyze an uploaded image for fraud indicators
    
    Returns:
        - imageStatus: GENUINE, SUSPICIOUS, or FRAUD
        - fraudScore: 0-100 (0 = genuine, 100 = definite fraud)
        - confidence: 0-100 (confidence in the assessment)
        - remarks: Detailed explanation
        - details: Additional analysis data
    """
    temp_file_path = None
    
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only images are accepted."
            )
        
        # Save uploaded file temporarily
        temp_file_path = UPLOAD_DIR / f"{image.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Step 1: Image preprocessing and validation
        processed_image = image_processor.process_image(str(temp_file_path))
        if not processed_image["valid"]:
            return JSONResponse(
                status_code=200,
                content={
                    "imageStatus": "SUSPICIOUS",
                    "fraudScore": 60,
                    "confidence": 70,
                    "remarks": f"Image validation failed: {processed_image['error']}",
                    "details": processed_image
                }
            )
        
        # Step 2: Metadata analysis
        metadata_result = metadata_analyzer.analyze_metadata(str(temp_file_path))
        
        # Step 3: Fraud detection analysis
        fraud_result = fraud_detector.detect_fraud(
            image_path=str(temp_file_path),
            processed_data=processed_image,
            metadata=metadata_result
        )
        
        # Combine results
        final_score = fraud_result["fraud_score"]
        confidence = fraud_result["confidence"]
        
        # Determine status based on score
        if final_score < 30:
            status = "GENUINE"
        elif final_score < 70:
            status = "SUSPICIOUS"
        else:
            status = "FRAUD"
        
        response = {
            "imageStatus": status,
            "fraudScore": int(final_score),
            "confidence": int(confidence),
            "remarks": fraud_result["remarks"],
            "details": {
                "imageQuality": processed_image.get("quality", "unknown"),
                "metadataFlags": metadata_result.get("flags", []),
                "detectionMethod": fraud_result.get("method", "heuristic"),
                "analysisTimestamp": fraud_result.get("timestamp"),
                "warnings": fraud_result.get("warnings", [])
            }
        }
        
        return JSONResponse(status_code=200, content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing image: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and temp_file_path.exists():
            try:
                os.remove(temp_file_path)
            except:
                pass


@app.post("/api/classify-evidence")
async def classify_evidence(image: UploadFile = File(...)):
    """
    Classify an uploaded document into evidence categories
    
    Returns:
        - documentType: Predicted category (HOSPITAL_BILL, DAMAGE_PHOTO, etc.)
        - displayName: Human-readable category name
        - confidence: Confidence score (0-100)
        - features: Detected features used for classification
    """
    temp_file_path = None
    
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only images are accepted."
            )
        
        # Save uploaded file temporarily
        temp_file_path = UPLOAD_DIR / f"{image.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Classify document
        result = evidence_classifier.classify_document(str(temp_file_path))
        
        return JSONResponse(status_code=200, content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error classifying document: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and temp_file_path.exists():
            try:
                os.remove(temp_file_path)
            except:
                pass


@app.post("/api/extract-ocr")
async def extract_ocr(
    image: UploadFile = File(...),
    document_type: str = "UNKNOWN"
):
    """
    Extract structured fields from document using OCR
    
    Query Parameters:
        - document_type: Optional document type hint for better extraction
    
    Returns:
        - extractedFields: Dict of extracted fields (dates, amounts, names, etc.)
        - confidence: Overall OCR confidence (0-100)
        - missingFields: List of expected but missing fields
        - validationWarnings: List of validation warnings
    """
    temp_file_path = None
    
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only images are accepted."
            )
        
        # Save uploaded file temporarily
        temp_file_path = UPLOAD_DIR / f"{image.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Extract OCR fields
        result = ocr_extractor.extract_fields(str(temp_file_path), document_type)
        
        return JSONResponse(status_code=200, content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting OCR data: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and temp_file_path.exists():
            try:
                os.remove(temp_file_path)
            except:
                pass


@app.post("/api/analyze-relevance")
async def analyze_relevance(request: dict):
    """
    Analyze if documents are relevant to claim type and mutually consistent
    
    Request Body:
        {
            "claimType": "AUTO" | "HEALTH" | "HOME" | etc.,
            "documents": [
                {
                    "documentType": "DAMAGE_PHOTO",
                    "confidence": 85,
                    "extractedFields": {...}
                },
                ...
            ]
        }
    
    Returns:
        - relevanceScore: How relevant documents are to claim type (0-100)
        - consistencyScore: How consistent documents are with each other (0-100)
        - warnings: List of relevance/consistency warnings
        - recommendations: Suggested actions
    """
    try:
        claim_type = request.get("claimType", "AUTO")
        documents = request.get("documents", [])
        
        if not documents:
            return JSONResponse(
                status_code=200,
                content={
                    "relevanceScore": 0,
                    "consistencyScore": 0,
                    "warnings": ["No documents provided for analysis"],
                    "recommendations": ["Upload required documents for this claim type"],
                    "success": True
                }
            )
        
        # Analyze relevance
        result = relevance_analyzer.analyze_relevance(claim_type, documents)
        
        return JSONResponse(status_code=200, content=result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing relevance: {str(e)}"
        )


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Insurance AI Service")
    print("   - Fraud Detection  [CNN + ViT Hybrid: EfficientNet-B4 + DeiT-Small]")
    print("   - Evidence Validation")
    print("   - OCR Extraction")
    print("=" * 60)
    print("📍 Server: http://localhost:5000")
    print("📖 API Docs: http://localhost:5000/docs")
    print("❤️  Health Check: http://localhost:5000/health")
    print("=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")

