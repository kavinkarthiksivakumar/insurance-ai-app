"""
CNN + ViT Fraud Detector
Replaces heuristic scoring with EfficientNet-B4 + DeiT-Small deep learning inference.
Falls back gracefully to heuristics if torch/timm are not installed.
"""

from datetime import datetime
import numpy as np


# ── Optional deep-learning imports ───────────────────────────────────────────
try:
    import torch
    from torchvision import transforms
    from PIL import Image as PILImage
    from model_loader import get_model, DEVICE
    DL_AVAILABLE = True
except ImportError:
    DL_AVAILABLE = False

# ── ImageNet normalisation (standard for timm models) ────────────────────────
_TRANSFORM = None
if DL_AVAILABLE:
    _TRANSFORM = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],   # ImageNet mean
            std =[0.229, 0.224, 0.225]    # ImageNet std
        )
    ])


class FraudDetector:
    """
    CNN + ViT hybrid fraud detection engine.

    Architecture:
      • EfficientNet-B4  — local artifact detection
        (pixel tampering, JPEG artifacts, copy-move, splicing)
      • DeiT-Small (ViT) — global context understanding
        (lighting anomalies, structural inconsistencies, deepfakes)
      • Fusion MLP       — combines both streams → fraud probability
    """

    THRESH_HIGH   = 70   # ≥70  → FRAUD
    THRESH_MEDIUM = 30   # ≥30  → SUSPICIOUS

    def __init__(self):
        self._model = None
        if DL_AVAILABLE:
            print("[FraudDetector] Loading CNN + ViT model …")
            self._model = get_model()
            print("[FraudDetector] Model ready ✓")
        else:
            print("[FraudDetector] torch/timm not available — using heuristic fallback.")

    # ─────────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────────

    def detect_fraud(self, image_path: str, processed_data: dict, metadata: dict) -> dict:
        """
        Main fraud detection entry point.

        Returns a dict with:
          fraud_score  : 0–100
          confidence   : 0–100
          image_status : GENUINE | SUSPICIOUS | FRAUD
          remarks      : human-readable explanation
          method       : 'CNN+ViT-hybrid' or 'heuristic-fallback'
          breakdown    : score contributors
        """
        if self._model is not None and processed_data.get("valid", False):
            return self._dl_detect(image_path, processed_data, metadata)
        return self._heuristic_detect(processed_data, metadata)

    def validate_document_authenticity(self, metadata: dict) -> float:
        """Returns an authenticity score 0–100 based on EXIF metadata."""
        score = 100.0
        if not metadata.get("camera_make") and not metadata.get("camera_model"):
            score -= 20
        if not metadata.get("datetime"):
            score -= 15
        if metadata.get("software"):
            score -= 25
        return max(0.0, score)

    # ─────────────────────────────────────────────────────────────────────────
    # Deep-learning path (CNN + ViT)
    # ─────────────────────────────────────────────────────────────────────────

    def _dl_detect(self, image_path: str, processed_data: dict, metadata: dict) -> dict:
        """Run EfficientNet-B4 + DeiT-Small inference on the image."""
        try:
            # 1. Load & preprocess image for the model
            pil_img = PILImage.open(image_path).convert("RGB")
            tensor  = _TRANSFORM(pil_img).unsqueeze(0).to(DEVICE)   # (1, 3, 224, 224)

            # 2. Forward pass (no gradients needed at inference)
            with torch.no_grad():
                logits = self._model(tensor)
                probs  = torch.softmax(logits, dim=1)[0]
                
                # Class mapping: 0=GENUINE, 1=SUSPICIOUS, 2=FRAUD
                gen_p  = float(probs[0])
                susp_p = float(probs[1])
                fraud_p = float(probs[2])

            # 3. Base DL score (0-100)
            # We weigh SUSPICIOUS as half-fraud for the continuous score
            dl_score = (susp_p * 0.4 + fraud_p * 1.0) * 100.0
            
            # Confidence is the probability of the most likely class
            confidence = max(gen_p, susp_p, fraud_p) * 100.0

            # 4. Metadata boost (max 20 points)
            meta_boost, meta_flags = self._metadata_boost(metadata)
            fraud_score = min(100.0, dl_score + meta_boost)

            # 5. Final Classification
            # If DL strongly predicts a class, we use that statuses directly
            if fraud_p > 0.6:
                status = "FRAUD"
            elif susp_p > 0.6 or (susp_p + fraud_p) > 0.7:
                status = "SUSPICIOUS"
            else:
                status = "GENUINE"
                
            # Refine remarks based on primary signal
            remarks = f"[CNN+ViT] DL Results: GEN:{gen_p:.1%}, SUSP:{susp_p:.1%}, FRAUD:{fraud_p:.1%}"
            if meta_flags:
                remarks += ". " + "; ".join(meta_flags[:2])

            return {
                "fraud_score"  : round(fraud_score, 2),
                "confidence"   : round(confidence, 2),
                "image_status" : status,
                "remarks"      : remarks,
                "warnings"     : meta_flags,
                "method"       : "CNN+ViT-hybrid",
                "timestamp"    : datetime.now().isoformat(),
                "breakdown"    : {
                    "gen_prob"        : round(gen_p, 4),
                    "susp_prob"       : round(susp_p, 4),
                    "fraud_prob"      : round(fraud_p, 4),
                    "dl_score"        : round(dl_score, 2),
                    "metadata_boost"  : round(meta_boost, 2),
                    "quality_factor"  : processed_data.get("quality", 0),
                    "blur_factor"     : processed_data.get("blur_level", 0),
                }
            }

        except Exception as exc:
            print(f"[FraudDetector] DL inference failed: {exc} — falling back to heuristics.")
            return self._heuristic_detect(processed_data, metadata)

    # ─────────────────────────────────────────────────────────────────────────
    # Heuristic fallback (original logic — no torch required)
    # ─────────────────────────────────────────────────────────────────────────

    def _heuristic_detect(self, processed_data: dict, metadata: dict) -> dict:
        fraud_score = 0.0
        confidence  = 85.0
        warnings    = []
        parts       = []

        # Quality
        quality   = processed_data.get("quality",    50)
        blur      = processed_data.get("blur_level", 50)
        if quality < 20:
            fraud_score += 15; warnings.append("Very low image quality")
        if blur > 70:
            fraud_score += 10; warnings.append("High blur level")

        # Metadata tampering
        tamper = metadata.get("tampering_score", 0)
        fraud_score += tamper * 0.4
        flags = metadata.get("flags", [])
        if flags:
            parts.append(f"Metadata concerns: {', '.join(flags[:2])}")
            confidence -= len(flags) * 3

        # File size
        fw, fh = processed_data.get("width", 0), processed_data.get("height", 0)
        fs = processed_data.get("file_size", 0)
        if fs and fs < fw * fh * 0.03:
            fraud_score += 10; warnings.append("Unusual file size ratio")

        # Software editing
        sw = metadata.get("software", "")
        if any(e in sw.lower() for e in ["photoshop", "gimp", "edited"]):
            fraud_score += 15; parts.append("Image editing software detected")

        import random
        fraud_score = max(0.0, min(100.0, fraud_score + random.uniform(-5, 5)))
        if not metadata.get("valid"):    confidence -= 15
        if not processed_data.get("valid"): confidence -= 20
        confidence = max(30.0, min(100.0, confidence))

        status, remarks = self._classify(fraud_score, warnings, method="heuristic")

        return {
            "fraud_score"  : round(fraud_score, 2),
            "confidence"   : round(confidence,  2),
            "image_status" : status,
            "remarks"      : remarks,
            "warnings"     : warnings,
            "method"       : "heuristic-fallback",
            "timestamp"    : datetime.now().isoformat(),
            "breakdown"    : {
                "quality_factor"  : quality,
                "metadata_factor" : tamper,
                "blur_factor"     : blur,
            }
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _metadata_boost(self, metadata: dict):
        """Returns (extra_score 0-20, list_of_flags)."""
        boost = 0.0
        flags = []
        tamper = metadata.get("tampering_score", 0)
        boost += tamper * 0.2   # up to 20 pts
        raw_flags = metadata.get("flags", [])
        flags.extend(raw_flags[:3])
        sw = metadata.get("software", "")
        if any(e in sw.lower() for e in ["photoshop", "gimp", "edited"]):
            boost += 5; flags.append("Editing software detected")
        return min(20.0, boost), flags

    def _compute_confidence(self, fraud_prob: float, processed_data: dict, metadata: dict) -> float:
        """
        Confidence is higher when the model prediction is decisive (near 0 or 1)
        and when both image and metadata are valid.
        """
        #  Distance from 0.5 → decisiveness (0.0–0.5)
        decisiveness = abs(fraud_prob - 0.5) * 2          # 0–1
        confidence   = 60.0 + decisiveness * 35.0         # 60–95
        if not metadata.get("valid"):        confidence -= 10
        if not processed_data.get("valid"): confidence -= 15
        return max(30.0, min(98.0, confidence))

    def _classify(self, score: float, flags: list, method: str):
        """Returns (status_string, remarks_string)."""
        flag_text = (". " + "; ".join(flags[:3])) if flags else ""
        if score < self.THRESH_MEDIUM:
            return "GENUINE",    f"[{method}] No significant fraud indicators.{flag_text}"
        if score < self.THRESH_HIGH:
            return "SUSPICIOUS", f"[{method}] ⚠️ Suspicious image — recommend manual review.{flag_text}"
        return     "FRAUD",      f"[{method}] 🚨 High fraud probability — recommend rejection.{flag_text}"
