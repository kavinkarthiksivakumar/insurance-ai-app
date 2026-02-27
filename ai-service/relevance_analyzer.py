"""
Relevance Analyzer Module
Analyzes if uploaded evidence is relevant to the claim type and mutually consistent
"""

from typing import Dict, List
from datetime import datetime
import re


class RelevanceAnalyzer:
    """
    Analyzes relevance and consistency of evidence documents
    """
    
    # Define expected document types for each claim type
    CLAIM_TYPE_REQUIREMENTS = {
        "AUTO": ["DAMAGE_PHOTO", "VEHICLE_RC", "REPAIR_ESTIMATE", "POLICE_REPORT"],
        "HEALTH": ["HOSPITAL_BILL", "DISCHARGE_SUMMARY", "ID_DOCUMENT"],
        "HOME": ["DAMAGE_PHOTO", "PROPERTY_DOCUMENT", "REPAIR_ESTIMATE", "POLICE_REPORT"],
        "LIFE": ["ID_DOCUMENT", "HOSPITAL_BILL", "DISCHARGE_SUMMARY"],
        "TRAVEL": ["ID_DOCUMENT", "HOSPITAL_BILL", "DAMAGE_PHOTO"]
    }
    
    def __init__(self):
        """Initialize relevance analyzer"""
        pass
    
    def analyze_relevance(
        self, 
        claim_type: str, 
        documents: List[Dict]
    ) -> Dict:
        """
        Analyze if documents are relevant to claim type
        
        Args:
            claim_type: Type of insurance claim (AUTO, HEALTH, HOME, etc.)
            documents: List of document classification results
                      Each dict should have: documentType, confidence
        
        Returns:
            Dict containing relevance score, consistency score, warnings, recommendations
        """
        try:
            # Normalize claim type
            claim_type_normalized = claim_type.upper().replace(" ", "_")
            if "AUTO" in claim_type_normalized or "VEHICLE" in claim_type_normalized:
                claim_type_key = "AUTO"
            elif "HEALTH" in claim_type_normalized or "MEDICAL" in claim_type_normalized:
                claim_type_key = "HEALTH"
            elif "HOME" in claim_type_normalized or "PROPERTY" in claim_type_normalized:
                claim_type_key = "HOME"
            elif "LIFE" in claim_type_normalized:
                claim_type_key = "LIFE"
            elif "TRAVEL" in claim_type_normalized:
                claim_type_key = "TRAVEL"
            else:
                claim_type_key = "AUTO"  # Default
            
            # Get expected document types
            expected_types = self.CLAIM_TYPE_REQUIREMENTS.get(claim_type_key, [])
            
            # Calculate relevance score
            relevance_result = self._calculate_relevance_score(
                documents, expected_types, claim_type_key
            )
            
            # Check cross-document consistency
            consistency_result = self._check_consistency(documents)
            
            # Generate warnings and recommendations
            warnings = []
            recommendations = []
            
            # Type mismatch warnings
            for doc in documents:
                doc_type = doc.get("documentType", "UNKNOWN")
                if doc_type not in expected_types and doc_type != "UNKNOWN":
                    warnings.append(
                        f"Document type '{doc_type}' may not be relevant for {claim_type} claim"
                    )
            
            # Consistency warnings
            if not consistency_result["is_consistent"]:
                warnings.extend(consistency_result["warnings"])
            
            # Recommendations
            if relevance_result["relevance_score"] < 70:
                recommendations.append(
                    f"Consider uploading documents of type: {', '.join(expected_types)}"
                )
            
            return {
                "relevanceScore": relevance_result["relevance_score"],
                "consistencyScore": consistency_result["consistency_score"],
                "warnings": warnings,
                "recommendations": recommendations,
                "expectedDocumentTypes": expected_types,
                "uploadedDocumentTypes": [doc.get("documentType") for doc in documents],
                "relevanceDetails": relevance_result,
                "consistencyDetails": consistency_result,
                "success": True
            }
            
        except Exception as e:
            return {
                "relevanceScore": 0,
                "consistencyScore": 0,
                "warnings": [f"Analysis error: {str(e)}"],
                "recommendations": [],
                "success": False,
                "error": str(e)
            }
    
    def _calculate_relevance_score(
        self, 
        documents: List[Dict], 
        expected_types: List[str],
        claim_type: str
    ) -> Dict:
        """Calculate how relevant the documents are to the claim type"""
        score = 0
        matched_types = []
        mismatched_types = []
        
        for doc in documents:
            doc_type = doc.get("documentType", "UNKNOWN")
            doc_confidence = doc.get("confidence", 0)
            
            if doc_type in expected_types:
                # Document is relevant
                matched_types.append(doc_type)
                # Weight by document classification confidence
                score += (100 * (doc_confidence / 100))
            elif doc_type == "UNKNOWN":
                # Unknown documents get neutral score
                score += 50
            else:
                # Document type doesn't match claim type
                mismatched_types.append(doc_type)
                score += 20  # Small score for having *something*
        
        # Normalize score based on number of documents
        if documents:
            avg_score = score / len(documents)
        else:
            avg_score = 0
        
        # Check for critical mismatches
        critical_mismatch = self._detect_critical_mismatch(
            mismatched_types, claim_type
        )
        
        if critical_mismatch:
            avg_score = min(avg_score, 40)  # Cap score if critical mismatch
        
        return {
            "relevance_score": int(avg_score),
            "matched_types": matched_types,
            "mismatched_types": mismatched_types,
            "critical_mismatch": critical_mismatch
        }
    
    def _detect_critical_mismatch(
        self, 
        mismatched_types: List[str], 
        claim_type: str
    ) -> bool:
        """Detect if there's a critical type mismatch"""
        # Critical mismatch examples:
        # - Medical documents for auto claim
        # - Vehicle documents for health claim
        
        medical_types = ["HOSPITAL_BILL", "DISCHARGE_SUMMARY"]
        vehicle_types = ["VEHICLE_RC"]
        
        if claim_type == "AUTO":
            # Medical docs for auto claim is suspicious
            if any(doc_type in medical_types for doc_type in mismatched_types):
                return True
        
        if claim_type == "HEALTH":
            # Vehicle docs for health claim is suspicious
            if any(doc_type in vehicle_types for doc_type in mismatched_types):
                return True
        
        return False
    
    def _check_consistency(self, documents: List[Dict]) -> Dict:
        """Check if documents are mutually consistent"""
        score = 100
        warnings = []
        
        # Extract dates from all documents
        dates = []
        for doc in documents:
            extracted_fields = doc.get("extractedFields", {})
            if "primaryDate" in extracted_fields:
                dates.append(extracted_fields["primaryDate"])
            if "dates" in extracted_fields:
                dates.extend(extracted_fields["dates"])
        
        # Check date consistency
        if len(dates) > 1:
            date_consistency = self._check_date_consistency(dates)
            if not date_consistency["consistent"]:
                warnings.append(date_consistency["warning"])
                score -= 20
        
        # Check amount consistency (if multiple bills)
        amounts = []
        for doc in documents:
            extracted_fields = doc.get("extractedFields", {})
            if "totalAmount" in extracted_fields and extracted_fields["totalAmount"]:
                try:
                    amount = float(extracted_fields["totalAmount"])
                    amounts.append(amount)
                except:
                    pass
        
        if len(amounts) > 1:
            # Check if amounts are vastly different (might indicate different claims)
            max_amount = max(amounts)
            min_amount = min(amounts)
            if max_amount > min_amount * 10:  # 10x difference
                warnings.append(
                    f"Large discrepancy in amounts across documents (₹{min_amount:.2f} vs ₹{max_amount:.2f})"
                )
                score -= 15
        
        # Check provider name consistency
        providers = []
        for doc in documents:
            extracted_fields = doc.get("extractedFields", {})
            if "providerName" in extracted_fields and extracted_fields["providerName"]:
                providers.append(extracted_fields["providerName"])
        
        if len(set(providers)) > 1 and len(providers) > 1:
            # Multiple different providers might be suspicious
            warnings.append(
                f"Documents appear to be from different providers: {', '.join(set(providers))}"
            )
            score -= 10
        
        is_consistent = score >= 70
        
        return {
            "consistency_score": max(0, score),
            "is_consistent": is_consistent,
            "warnings": warnings,
            "dates_found": len(dates),
            "amounts_found": len(amounts),
            "providers_found": len(set(providers))
        }
    
    def _check_date_consistency(self, dates: List[str]) -> Dict:
        """Check if dates are consistent (within reasonable range)"""
        try:
            parsed_dates = []
            
            for date_str in dates:
                # Try multiple formats
                for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%Y/%m/%d']:
                    try:
                        parsed_date = datetime.strptime(date_str.strip(), fmt)
                        parsed_dates.append(parsed_date)
                        break
                    except ValueError:
                        continue
            
            if len(parsed_dates) < 2:
                return {"consistent": True, "warning": None}
            
            # Check if all dates are within 60 days of each other
            min_date = min(parsed_dates)
            max_date = max(parsed_dates)
            
            days_diff = (max_date - min_date).days
            
            if days_diff > 60:
                return {
                    "consistent": False,
                    "warning": f"Documents have dates spanning {days_diff} days - may be from different incidents"
                }
            
            return {"consistent": True, "warning": None}
            
        except Exception as e:
            return {
                "consistent": True,
                "warning": None,
                "error": f"Date consistency check failed: {str(e)}"
            }
