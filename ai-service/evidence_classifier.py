"""
Evidence Classifier Module
Classifies uploaded documents into categories to verify evidence type matches claim requirements
"""

import cv2
import numpy as np
from PIL import Image
import pytesseract
from pathlib import Path
from typing import Dict, List, Tuple
import re


class EvidenceClassifier:
    """
    Classifies evidence documents into predefined categories using image analysis
    and basic ML heuristics.
    """
    
    # Document categories
    CATEGORIES = {
        "HOSPITAL_BILL": "Hospital Bill / Medical Invoice",
        "DAMAGE_PHOTO": "Damage Photograph",
        "ID_DOCUMENT": "Identity Document",
        "VEHICLE_RC": "Vehicle Registration Certificate",
        "PROPERTY_DOCUMENT": "Property Ownership Document",
        "DISCHARGE_SUMMARY": "Medical Discharge Summary",
        "REPAIR_ESTIMATE": "Repair Estimate / Invoice",
        "POLICE_REPORT": "Police Report",
        "UNKNOWN": "Unknown Document Type"
    }
    
    def __init__(self):
        """Initialize the classifier"""
        pass
    
    def classify_document(self, image_path: str) -> Dict:
        """
        Classify a document image into one of the predefined categories
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dict containing:
                - documentType: Predicted category
                - confidence: Confidence score (0-100)
                - features: Detected features used for classification
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return self._error_result("Failed to load image")
            
            # Extract features
            features = self._extract_features(image, image_path)
            
            # Classify based on features
            classification = self._classify_from_features(features)
            
            return {
                "documentType": classification["type"],
                "displayName": self.CATEGORIES.get(classification["type"], "Unknown"),
                "confidence": classification["confidence"],
                "features": features,
                "success": True
            }
            
        except Exception as e:
            return self._error_result(f"Classification error: {str(e)}")
    
    def _extract_features(self, image: np.ndarray, image_path: str) -> Dict:
        """Extract features from the image for classification"""
        features = {}
        
        # Image dimensions and aspect ratio
        height, width = image.shape[:2]
        features["aspect_ratio"] = width / height
        features["resolution"] = f"{width}x{height}"
        
        # Color analysis
        features["is_color"] = len(image.shape) == 3
        if features["is_color"]:
            # Check if predominantly grayscale (photos vs scanned docs)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            color_variance = np.var(image)
            gray_variance = np.var(gray)
            features["color_variance"] = float(color_variance)
            features["is_document_like"] = color_variance < gray_variance * 1.2
        
        # Text density analysis using OCR
        features["text_info"] = self._analyze_text_content(image_path)
        
        # Edge detection for structure analysis
        features["structure"] = self._analyze_structure(image)
        
        # Detect tables/forms (common in bills and documents)
        features["has_tables"] = self._detect_tables(image)
        
        return features
    
    def _analyze_text_content(self, image_path: str) -> Dict:
        """Analyze text content using OCR"""
        try:
            # Use pytesseract to extract text
            text = pytesseract.image_to_string(Image.open(image_path))
            
            # Calculate text density
            words = text.split()
            word_count = len(words)
            
            # Look for medical keywords
            medical_keywords = [
                'hospital', 'patient', 'diagnosis', 'treatment', 'doctor', 'medical',
                'discharge', 'admission', 'prescription', 'bill', 'invoice', 'amount'
            ]
            medical_score = sum(1 for word in words if word.lower() in medical_keywords)
            
            # Look for vehicle keywords
            vehicle_keywords = [
                'vehicle', 'registration', 'engine', 'chassis', 'owner', 'model',
                'license', 'rc', 'rto', 'insurance'
            ]
            vehicle_score = sum(1 for word in words if word.lower() in vehicle_keywords)
            
            # Look for property keywords
            property_keywords = [
                'property', 'owner', 'deed', 'title', 'address', 'premises',
                'building', 'plot', 'survey'
            ]
            property_score = sum(1 for word in words if word.lower() in property_keywords)
            
            # Look for financial keywords (bills, invoices)
            financial_keywords = [
                'total', 'amount', 'paid', 'due', 'invoice', 'bill', 'receipt',
                'payment', 'date', 'number', 'tax', 'gst'
            ]
            financial_score = sum(1 for word in words if word.lower() in financial_keywords)
            
            return {
                "word_count": word_count,
                "medical_score": medical_score,
                "vehicle_score": vehicle_score,
                "property_score": property_score,
                "financial_score": financial_score,
                "has_text": word_count > 10
            }
            
        except Exception as e:
            return {
                "word_count": 0,
                "medical_score": 0,
                "vehicle_score": 0,
                "property_score": 0,
                "financial_score": 0,
                "has_text": False,
                "error": str(e)
            }
    
    def _analyze_structure(self, image: np.ndarray) -> Dict:
        """Analyze image structure using edge detection"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Detect horizontal and vertical lines (common in documents/forms)
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        
        horizontal_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, horizontal_kernel)
        vertical_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, vertical_kernel)
        
        has_grid = (np.sum(horizontal_lines) > 0) and (np.sum(vertical_lines) > 0)
        
        return {
            "edge_density": float(edge_density),
            "has_grid_structure": bool(has_grid),
            "is_structured_document": edge_density > 0.05 and has_grid
        }
    
    def _detect_tables(self, image: np.ndarray) -> bool:
        """Detect if image contains table structures"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Adaptive threshold to detect document structure
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Count rectangular contours (potential table cells)
        rectangular_contours = 0
        for contour in contours:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            if len(approx) == 4:  # Rectangle
                rectangular_contours += 1
        
        # If many rectangular shapes, likely a table/form
        return rectangular_contours > 5
    
    def _classify_from_features(self, features: Dict) -> Dict:
        """Classify document based on extracted features"""
        scores = {
            "HOSPITAL_BILL": 0,
            "DAMAGE_PHOTO": 0,
            "ID_DOCUMENT": 0,
            "VEHICLE_RC": 0,
            "PROPERTY_DOCUMENT": 0,
            "DISCHARGE_SUMMARY": 0,
            "REPAIR_ESTIMATE": 0,
            "POLICE_REPORT": 0,
            "UNKNOWN": 0
        }
        
        text_info = features.get("text_info", {})
        structure = features.get("structure", {})
        
        # Hospital Bill classification
        if text_info.get("medical_score", 0) > 2 and text_info.get("financial_score", 0) > 2:
            scores["HOSPITAL_BILL"] += 60
            if features.get("has_tables", False):
                scores["HOSPITAL_BILL"] += 20
        
        # Discharge Summary classification
        if text_info.get("medical_score", 0) > 3 and text_info.get("word_count", 0) > 50:
            scores["DISCHARGE_SUMMARY"] += 50
            if not features.get("has_tables", False):
                scores["DISCHARGE_SUMMARY"] += 10
        
        # Damage Photo classification
        if not text_info.get("has_text", False) or text_info.get("word_count", 0) < 20:
            if features.get("is_color", False) and not features.get("is_document_like", False):
                scores["DAMAGE_PHOTO"] += 70
        
        # Vehicle RC classification
        if text_info.get("vehicle_score", 0) > 2:
            scores["VEHICLE_RC"] += 50
            if structure.get("is_structured_document", False):
                scores["VEHICLE_RC"] += 30
        
        # Property Document classification
        if text_info.get("property_score", 0) > 2:
            scores["PROPERTY_DOCUMENT"] += 50
            if structure.get("is_structured_document", False):
                scores["PROPERTY_DOCUMENT"] += 20
        
        # Repair Estimate classification
        if text_info.get("financial_score", 0) > 2 and not text_info.get("medical_score", 0):
            scores["REPAIR_ESTIMATE"] += 40
            if features.get("has_tables", False):
                scores["REPAIR_ESTIMATE"] += 20
        
        # ID Document classification
        if structure.get("is_structured_document", False) and text_info.get("word_count", 0) < 100:
            if features.get("aspect_ratio", 0) > 1.4 and features.get("aspect_ratio", 0) < 1.8:
                scores["ID_DOCUMENT"] += 50
        
        # Get highest score
        max_score = max(scores.values())
        
        if max_score < 30:  # Low confidence threshold
            return {
                "type": "UNKNOWN",
                "confidence": 20
            }
        
        predicted_type = max(scores, key=scores.get)
        
        # Normalize confidence to 0-100 scale
        confidence = min(100, int(max_score))
        
        return {
            "type": predicted_type,
            "confidence": confidence
        }
    
    def verify_document_match(
        self, 
        classified_type: str, 
        expected_categories: List[str]
    ) -> Dict:
        """
        Verify if classified document type matches expected categories
        
        Args:
            classified_type: The predicted document type
            expected_categories: List of expected document categories for the claim
            
        Returns:
            Dict with match status and details
        """
        is_match = classified_type in expected_categories
        
        return {
            "isMatch": is_match,
            "classifiedType": classified_type,
            "expectedCategories": expected_categories,
            "message": "Document type matches requirements" if is_match 
                      else f"Expected one of {expected_categories}, but got {classified_type}"
        }
    
    def _error_result(self, error_message: str) -> Dict:
        """Return error result"""
        return {
            "documentType": "UNKNOWN",
            "displayName": "Unknown - Error",
            "confidence": 0,
            "features": {},
            "success": False,
            "error": error_message
        }
