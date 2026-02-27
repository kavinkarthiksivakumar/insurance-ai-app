"""
OCR Extractor Module
Extracts structured fields from document images using OCR
"""

import pytesseract
from PIL import Image
import cv2
import numpy as np
import re
from typing import Dict, List, Optional
from datetime import datetime
import json


class OcrExtractor:
    """
    OCR-based field extraction from insurance documents
    Extracts invoice numbers, dates, amounts, names, etc.
    """
    
    def __init__(self):
        """Initialize OCR extractor"""
        self.date_patterns = [
            r'\d{2}[-/]\d{2}[-/]\d{4}',  # DD-MM-YYYY or DD/MM/YYYY
            r'\d{4}[-/]\d{2}[-/]\d{2}',  # YYYY-MM-DD or YYYY/MM/DD
            r'\d{2}\s+[A-Za-z]{3,9}\s+\d{4}',  # DD Month YYYY
        ]
        
        self.amount_patterns = [
            r'(?:Rs\.?|INR|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # Rs. 1,234.56
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:Rs\.?|INR|₹)',  # 1,234.56 Rs
            r'Total[:\s]+(?:Rs\.?|INR|₹)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # Total: Rs. 1,234
        ]
        
        self.invoice_patterns = [
            r'Invoice\s*(?:No|Number|#)[:\s]*([A-Z0-9\-/]+)',
            r'Bill\s*(?:No|Number|#)[:\s]*([A-Z0-9\-/]+)',
            r'Receipt\s*(?:No|Number|#)[:\s]*([A-Z0-9\-/]+)',
        ]
    
    def extract_fields(self, image_path: str, document_type: str = "UNKNOWN") -> Dict:
        """
        Extract structured fields from a document image
        
        Args:
            image_path: Path to the image file
            document_type: Classified document type for context
            
        Returns:
            Dict containing extracted fields, confidence, and validation results
        """
        try:
            # Preprocess image for better OCR
            preprocessed_image = self._preprocess_image(image_path)
            
            # Extract text using OCR
            text = pytesseract.image_to_string(preprocessed_image)
            
            # Extract structured data
            extracted_data = pytesseract.image_to_data(preprocessed_image, output_type=pytesseract.Output.DICT)
            
            # Extract specific fields
            fields = self._extract_structured_fields(text, document_type)
            
            # Validate extracted fields
            validation = self._validate_fields(fields)
            
            # Calculate overall confidence
            confidence = self._calculate_confidence(fields, validation)
            
            return {
                "extractedFields": fields,
                "confidence": confidence,
                "missingFields": validation["missing_fields"],
                "validationWarnings": validation["warnings"],
                "rawText": text[:500] if text else "",  # First 500 chars for debugging
                "success": True
            }
            
        except Exception as e:
            return {
                "extractedFields": {},
                "confidence": 0,
                "missingFields": [],
                "validationWarnings": [],
                "success": False,
                "error": f"OCR extraction failed: {str(e)}"
            }
    
    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR accuracy"""
        # Load image
        image = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply adaptive thresholding for better text extraction
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Increase contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(thresh)
        
        return enhanced
    
    def _extract_structured_fields(self, text: str, document_type: str) -> Dict:
        """Extract structured fields from OCR text"""
        fields = {}
        
        # Extract dates
        dates = self._extract_dates(text)
        if dates:
            fields["dates"] = dates
            # Primary date (usually the first or most prominent one)
            fields["primaryDate"] = dates[0] if dates else None
        
        # Extract amounts
        amounts = self._extract_amounts(text)
        if amounts:
            fields["amounts"] = amounts
            # Total amount (usually the largest or labeled as total)
            fields["totalAmount"] = amounts[-1] if amounts else None
        
        # Extract invoice/bill number
        invoice_number = self._extract_invoice_number(text)
        if invoice_number:
            fields["invoiceNumber"] = invoice_number
        
        # Extract names (hospitals, garages, providers)
        names = self._extract_names(text)
        if names:
            fields["providerName"] = names.get("provider")
            fields["patientName"] = names.get("patient")
        
        # Document type-specific extraction
        if document_type == "HOSPITAL_BILL":
            fields.update(self._extract_medical_fields(text))
        elif document_type == "VEHICLE_RC":
            fields.update(self._extract_vehicle_fields(text))
        
        return fields
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract all dates from text"""
        dates = []
        
        for pattern in self.date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            dates.extend(matches)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_dates = []
        for date in dates:
            if date not in seen:
                seen.add(date)
                unique_dates.append(date)
        
        return unique_dates
    
    def _extract_amounts(self, text: str) -> List[str]:
        """Extract all monetary amounts from text"""
        amounts = []
        
        for pattern in self.amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            amounts.extend(matches)
        
        # Clean and format amounts
        cleaned_amounts = []
        for amount in amounts:
            # Remove commas and keep only digits and decimal point
            cleaned = re.sub(r'[^\d.]', '', amount)
            if cleaned:
                cleaned_amounts.append(cleaned)
        
        return cleaned_amounts
    
    def _extract_invoice_number(self, text: str) -> Optional[str]:
        """Extract invoice/bill number"""
        for pattern in self.invoice_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_names(self, text: str) -> Dict:
        """Extract organization and person names"""
        names = {}
        
        # Look for hospital/garage/provider names
        # Usually near the top or after keywords
        lines = text.split('\n')
        
        # Provider name (usually in first few lines)
        for i in range(min(10, len(lines))):
            line = lines[i].strip()
            # Skip very short lines or lines with special characters
            if len(line) > 5 and len(line) < 100 and re.match(r'^[A-Za-z\s&\.]+$', line):
                if not names.get("provider"):
                    names["provider"] = line
                    break
        
        # Patient/Customer name
        patient_patterns = [
            r'Patient\s*Name[:\s]+([A-Za-z\s]+)',
            r'Name[:\s]+([A-Za-z\s]+)',
            r'Customer[:\s]+([A-Za-z\s]+)',
        ]
        
        for pattern in patient_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                names["patient"] = match.group(1).strip()
                break
        
        return names
    
    def _extract_medical_fields(self, text: str) -> Dict:
        """Extract medical-specific fields"""
        fields = {}
        
        # Look for diagnosis
        diagnosis_match = re.search(r'Diagnosis[:\s]+([^\n]+)', text, re.IGNORECASE)
        if diagnosis_match:
            fields["diagnosis"] = diagnosis_match.group(1).strip()
        
        # Look for admission/discharge dates
        admission_match = re.search(r'Admission\s*Date[:\s]+([^\n]+)', text, re.IGNORECASE)
        if admission_match:
            fields["admissionDate"] = admission_match.group(1).strip()
        
        discharge_match = re.search(r'Discharge\s*Date[:\s]+([^\n]+)', text, re.IGNORECASE)
        if discharge_match:
            fields["dischargeDate"] = discharge_match.group(1).strip()
        
        return fields
    
    def _extract_vehicle_fields(self, text: str) -> Dict:
        """Extract vehicle-specific fields"""
        fields = {}
        
        # Registration number
        reg_patterns = [
            r'Registration\s*(?:No|Number)[:\s]+([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4})',
            r'([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4})',  # Direct pattern like MH-12-AB-1234
        ]
        
        for pattern in reg_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                fields["registrationNumber"] = match.group(1).strip()
                break
        
        # Engine number
        engine_match = re.search(r'Engine\s*(?:No|Number)[:\s]+([A-Z0-9]+)', text, re.IGNORECASE)
        if engine_match:
            fields["engineNumber"] = engine_match.group(1).strip()
        
        # Chassis number
        chassis_match = re.search(r'Chassis\s*(?:No|Number)[:\s]+([A-Z0-9]+)', text, re.IGNORECASE)
        if chassis_match:
            fields["chassisNumber"] = chassis_match.group(1).strip()
        
        return fields
    
    def _validate_fields(self, fields: Dict) -> Dict:
        """Validate extracted fields"""
        warnings = []
        missing_fields = []
        
        # Check for primary date
        if "primaryDate" not in fields or not fields["primaryDate"]:
            missing_fields.append("date")
        else:
            # Validate date is not in future
            date_warning = self._validate_date(fields["primaryDate"])
            if date_warning:
                warnings.append(date_warning)
        
        # Check for amount
        if "totalAmount" not in fields or not fields["totalAmount"]:
            missing_fields.append("amount")
        else:
            # Validate amount is reasonable
            amount_warning = self._validate_amount(fields["totalAmount"])
            if amount_warning:
                warnings.append(amount_warning)
        
        # Check for invoice number
        if "invoiceNumber" not in fields or not fields["invoiceNumber"]:
            missing_fields.append("invoice/bill number")
        
        # Check for provider name
        if "providerName" not in fields or not fields["providerName"]:
            warnings.append("Provider name not detected")
        
        return {
            "warnings": warnings,
            "missing_fields": missing_fields
        }
    
    def _validate_date(self, date_str: str) -> Optional[str]:
        """Validate date field"""
        # Try to parse and check if it's a future date or too old
        try:
            # Try multiple date formats
            for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%Y/%m/%d']:
                try:
                    parsed_date = datetime.strptime(date_str.strip(), fmt)
                    
                    # Check if future date
                    if parsed_date > datetime.now():
                        return f"Date {date_str} is in the future"
                    
                    # Check if too old (more than 2 years)
                    years_old = (datetime.now() - parsed_date).days / 365
                    if years_old > 2:
                        return f"Date {date_str} is more than 2 years old"
                    
                    return None  # Valid date
                except ValueError:
                    continue
            
            return "Date format could not be validated"
        except:
            return "Date validation failed"
    
    def _validate_amount(self, amount_str: str) -> Optional[str]:
        """Validate amount field"""
        try:
            amount = float(amount_str)
            
            # Check if amount is too small or too large
            if amount < 100:
                return f"Amount {amount} seems unusually low"
            if amount > 10000000:  # 1 crore
                return f"Amount {amount} seems unusually high"
            
            return None  # Valid amount
        except:
            return "Amount format is invalid"
    
    def _calculate_confidence(self, fields: Dict, validation: Dict) -> int:
        """Calculate overall OCR confidence score"""
        score = 100
        
        # Deduct points for missing fields
        missing_count = len(validation["missing_fields"])
        score -= (missing_count * 15)
        
        # Deduct points for warnings
        warning_count = len(validation["warnings"])
        score -= (warning_count * 10)
        
        # Bonus for having all key fields
        key_fields = ["primaryDate", "totalAmount", "invoiceNumber", "providerName"]
        found_fields = sum(1 for field in key_fields if field in fields and fields[field])
        score += (found_fields * 5)
        
        # Ensure score is in range 0-100
        return max(0, min(100, score))
