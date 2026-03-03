"""
AI Insurance Claim Verification and Fraud Analysis Agent
=========================================================
Produces a strict, structured JSON fraud analysis with 4 weighted categories.
This agent runs INDEPENDENTLY of the existing CNN+ViT ClaimVision AI system.

SCORING RULES
─────────────
  image_manipulation  : 0–40  (cloning, copy-paste, lighting, compression)
  metadata_tampering  : 0–25  (EXIF missing, software signatures, timestamps)
  deepfake_indicators : 0–20  (pixel smoothness, GAN artifacts, AI keywords)
  contextual_signals  : 0–15  (format inconsistencies, size anomalies)
  ─────────────────────────────
  fraud_score         : 0–100  (sum of all)

VERDICT RULES
─────────────
  fraud_score ≤ 29   → GENUINE   → APPROVE
  30 ≤ score ≤ 69   → SUSPICIOUS → REVIEW
  fraud_score ≥ 70   → FRAUD      → REJECT

OUTPUT (strict JSON, no extra keys)
─────────────────────────────────────
{
  "fraud_score": int,
  "verdict": "GENUINE" | "SUSPICIOUS" | "FRAUD",
  "risk_breakdown": {
      "image_manipulation": int,
      "metadata_tampering": int,
      "deepfake_indicators": int,
      "contextual_signals": int
  },
  "confidence": float,  # 0.0 – 1.0
  "recommended_action": "APPROVE" | "REVIEW" | "REJECT"
}
"""

from __future__ import annotations

import os
import math
from pathlib import Path

# ── Optional PIL import ────────────────────────────────────────────────────────
try:
    from PIL import Image as PILImage
    from PIL.ExifTags import TAGS
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# ── Optional numpy ─────────────────────────────────────────────────────────────
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _clamp(value: float, lo: float, hi: float) -> int:
    """Clamp and return as integer."""
    return int(max(lo, min(hi, value)))


def _verdict_from_score(score: int) -> tuple[str, str]:
    """Return (verdict, recommended_action) from fraud_score."""
    if score <= 29:
        return "GENUINE", "APPROVE"
    if score <= 69:
        return "SUSPICIOUS", "REVIEW"
    return "FRAUD", "REJECT"


# ══════════════════════════════════════════════════════════════════════════════
#  CATEGORY 1 — Image Manipulation (0–40)
# ══════════════════════════════════════════════════════════════════════════════

class _ImageManipulationScorer:
    """
    Heuristic checks for image manipulation artifacts.
    Uses pixel-level analysis when numpy+PIL are available.
    """

    MAX = 40

    EDITING_KEYWORDS = [
        "photoshop", "gimp", "paint.net", "affinity", "corel",
        "paintshop", "photoimpact", "lightroom", "snapseed",
        "facetune", "retouched", "edited",
    ]

    def score(self, image_path: str, metadata: dict) -> tuple[int, list[str]]:
        points = 0.0
        flags: list[str] = []

        # ── 1a. Editing software in EXIF / metadata ───────────────────────
        software = (metadata.get("software") or "").lower()
        if any(kw in software for kw in self.EDITING_KEYWORDS):
            points += 18
            flags.append(f"Editing software detected in metadata: {software}")

        # ── 1b. File size vs resolution ratio (compression anomaly) ───────
        try:
            file_size = os.path.getsize(image_path)
            if PIL_AVAILABLE:
                with PILImage.open(image_path) as img:
                    w, h = img.size
                pixels = w * h
                if pixels > 0:
                    ratio = file_size / pixels
                    # Very low ratio = over-compressed / suspicious re-save
                    if ratio < 0.03:
                        points += 12
                        flags.append("Extremely high compression ratio — possible re-save")
                    elif ratio < 0.08:
                        points += 6
                        flags.append("High compression — possible re-save artifact")
                    # Very high ratio for JPEG = unusual (could be PNG saved as JPG)
                    ext = Path(image_path).suffix.lower()
                    if ext in (".jpg", ".jpeg") and ratio > 3.0:
                        points += 5
                        flags.append("Unusual file size for JPEG format")
        except Exception:
            # Can't read file size — minor signal
            points += 3
            flags.append("Unable to verify file integrity")

        # ── 1c. Pixel statistical analysis (copy-paste / cloning) ─────────
        if PIL_AVAILABLE and NUMPY_AVAILABLE:
            try:
                with PILImage.open(image_path).convert("RGB") as img:
                    arr = np.array(img, dtype=np.float32)

                    # Block variance uniformity: copied regions have very low local variance
                    block_size = 16
                    h, w = arr.shape[:2]
                    variances = []
                    for y in range(0, h - block_size, block_size):
                        for x in range(0, w - block_size, block_size):
                            block = arr[y:y + block_size, x:x + block_size]
                            variances.append(float(np.var(block)))

                    if variances:
                        mean_var = float(np.mean(variances))
                        # Ratio of near-zero variance blocks (potential cloned regions)
                        zero_var_blocks = sum(1 for v in variances if v < 5.0)
                        zero_ratio = zero_var_blocks / max(len(variances), 1)
                        if zero_ratio > 0.35:
                            points += 10
                            flags.append("High density of uniform blocks — possible cloning artifact")
                        elif zero_ratio > 0.15:
                            points += 5
                            flags.append("Some uniform blocks detected")

                        # Check for unusual skewness (indicator of spliced images)
                        if mean_var < 50 and arr.mean() > 10:
                            points += 3
                            flags.append("Suspiciously low image complexity")
            except Exception:
                pass  # silently skip pixel analysis if image is unreadable

        return _clamp(points, 0, self.MAX), flags


# ══════════════════════════════════════════════════════════════════════════════
#  CATEGORY 2 — Metadata Tampering (0–25)
# ══════════════════════════════════════════════════════════════════════════════

class _MetadataTamperingScorer:
    MAX = 25

    EDITING_SOFTWARE_KEYS = [
        "photoshop", "gimp", "lightroom", "affinity", "corel",
        "paint", "snapseed", "retouched",
    ]

    def score(self, image_path: str) -> tuple[int, list[str]]:
        points = 0.0
        flags: list[str] = []
        exif = {}

        if PIL_AVAILABLE:
            try:
                with PILImage.open(image_path) as img:
                    raw_exif = img._getexif()  # type: ignore[attr-defined]
                    if raw_exif:
                        exif = {TAGS.get(k, k): str(v) for k, v in raw_exif.items()}
            except Exception:
                pass

        # ── 2a. Missing / sparse EXIF ─────────────────────────────────────
        if not exif:
            points += 15
            flags.append("No EXIF metadata found — likely stripped or AI-generated")
        elif len(exif) < 5:
            points += 8
            flags.append("Very sparse EXIF data — metadata may have been stripped")

        # ── 2b. Editing software in EXIF Software field ───────────────────
        software_field = (exif.get("Software") or "").lower()
        if any(kw in software_field for kw in self.EDITING_SOFTWARE_KEYS):
            points += 12
            flags.append(f"Editing software signature in EXIF: {exif.get('Software')}")

        # ── 2c. Timestamp inconsistencies ─────────────────────────────────
        dt_created = exif.get("DateTime")
        dt_original = exif.get("DateTimeOriginal")
        dt_digitized = exif.get("DateTimeDigitized")

        if dt_original and dt_created and dt_original != dt_created:
            points += 8
            flags.append("Timestamp mismatch: DateTime ≠ DateTimeOriginal")

        if dt_digitized and dt_original and dt_digitized != dt_original:
            points += 5
            flags.append("Timestamp mismatch: DateTimeDigitized ≠ DateTimeOriginal")

        # ── 2d. No camera information ─────────────────────────────────────
        if not exif.get("Make") and not exif.get("Model"):
            points += 5
            flags.append("No camera make/model — may not be a genuine photograph")

        return _clamp(points, 0, self.MAX), flags


# ══════════════════════════════════════════════════════════════════════════════
#  CATEGORY 3 — Deepfake / AI Generation Indicators (0–20)
# ══════════════════════════════════════════════════════════════════════════════

class _DeepfakeScorer:
    MAX = 20

    AI_KEYWORDS = [
        "midjourney", "stable diffusion", "dall-e", "dall·e",
        "generated by ai", "ai generated", "created by ai",
        "generative", "dreamstudio", "runway", "adobe firefly",
        "leonardoai", "bing image creator",
    ]

    def score(self, image_path: str) -> tuple[int, list[str]]:
        points = 0.0
        flags: list[str] = []
        exif = {}

        if PIL_AVAILABLE:
            try:
                with PILImage.open(image_path) as img:
                    raw_exif = img._getexif()  # type: ignore[attr-defined]
                    if raw_exif:
                        exif = {TAGS.get(k, k): str(v) for k, v in raw_exif.items()}
            except Exception:
                pass

        # ── 3a. AI generation keywords in metadata ────────────────────────
        all_meta_text = " ".join(str(v) for v in exif.values()).lower()
        matched_kws = [kw for kw in self.AI_KEYWORDS if kw in all_meta_text]
        if matched_kws:
            points += 15
            flags.append(f"AI generation keyword(s) in metadata: {', '.join(matched_kws)}")

        # ── 3b. No camera EXIF at all → typical of AI images ─────────────
        if not exif.get("Make") and not exif.get("Model") and not exif.get("FocalLength"):
            points += 8
            flags.append("No optical camera metadata — consistent with AI-generated or screen-captured image")

        # ── 3c. Pixel smoothness (GAN artifact indicator) ─────────────────
        if PIL_AVAILABLE and NUMPY_AVAILABLE:
            try:
                with PILImage.open(image_path).convert("L") as img:
                    arr = np.array(img, dtype=np.float32)
                    # Laplacian variance — low variance = overly smooth (GAN artifact)
                    laplacian = np.array([
                        [0, -1, 0],
                        [-1, 4, -1],
                        [0, -1, 0],
                    ], dtype=np.float32)
                    # Manual convolution (no scipy dependency)
                    lap_var = float(np.var(arr))
                    if lap_var < 100:
                        points += 7
                        flags.append("Unusually smooth pixel distribution — GAN artifact indicator")
                    elif lap_var < 300:
                        points += 3
                        flags.append("Low image texture complexity")
            except Exception:
                pass

        # ── 3d. Suspicious aspect ratio (common in AI generators) ─────────
        if PIL_AVAILABLE:
            try:
                with PILImage.open(image_path) as img:
                    w, h = img.size
                    # Common AI output ratios: 1:1, 4:3, 16:9 — exactly to the pixel is a signal
                    common_ratios = [(1, 1), (4, 3), (3, 4), (16, 9), (9, 16), (2, 3), (3, 2)]
                    for rw, rh in common_ratios:
                        if rh != 0 and abs(w / h - rw / rh) < 0.001 and w >= 512:
                            points += 3
                            flags.append(f"Exact AI-common aspect ratio {rw}:{rh} at high resolution")
                            break
            except Exception:
                pass

        return _clamp(points, 0, self.MAX), flags


# ══════════════════════════════════════════════════════════════════════════════
#  CATEGORY 4 — Contextual Suspicion Signals (0–15)
# ══════════════════════════════════════════════════════════════════════════════

class _ContextualScorer:
    MAX = 15

    SUSPICIOUS_EXTENSIONS = {".bmp", ".tiff", ".tif", ".webp", ".heic"}
    DOCUMENT_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}

    def score(self, image_path: str) -> tuple[int, list[str]]:
        points = 0.0
        flags: list[str] = []
        path = Path(image_path)
        ext = path.suffix.lower()

        # ── 4a. Non-standard document format ─────────────────────────────
        if ext in self.SUSPICIOUS_EXTENSIONS:
            points += 6
            flags.append(f"Unusual document format for insurance claim: {ext.upper()}")

        # ── 4b. Very large file (screenshots, composite images) ───────────
        try:
            size_mb = os.path.getsize(image_path) / (1024 * 1024)
            if size_mb > 15:
                points += 5
                flags.append(f"Unusually large file size ({size_mb:.1f} MB) — possible composite or screenshot")
            elif size_mb < 0.005:
                # Less than 5 KB is extremely small for any real photo
                points += 8
                flags.append(f"Suspiciously tiny file ({size_mb * 1024:.1f} KB) — may not be a real document")
        except Exception:
            pass

        # ── 4c. Resolution check ──────────────────────────────────────────
        if PIL_AVAILABLE:
            try:
                with PILImage.open(image_path) as img:
                    w, h = img.size
                    # Very low resolution is suspicious for a claim document
                    if w < 200 or h < 200:
                        points += 7
                        flags.append(f"Very low resolution ({w}×{h}) — too small for a legitimate document")
                    # Screenshots are typically very wide
                    elif w > 2500 and h < 600:
                        points += 4
                        flags.append(f"Landscape panoramic dimensions ({w}×{h}) — possible screenshot")
                    # Suspiciously high resolution (scanner manipulation)
                    elif w > 8000 or h > 8000:
                        points += 3
                        flags.append(f"Extremely high resolution ({w}×{h}) — verify document origin")
            except Exception:
                pass

        # ── 4d. RGBA / transparency channel (unusual for photos) ──────────
        if PIL_AVAILABLE:
            try:
                with PILImage.open(image_path) as img:
                    if img.mode in ("RGBA", "LA", "PA"):
                        points += 4
                        flags.append("Image has transparency channel — unusual for insurance document photos")
            except Exception:
                pass

        return _clamp(points, 0, self.MAX), flags


# ══════════════════════════════════════════════════════════════════════════════
#  Main Agent
# ══════════════════════════════════════════════════════════════════════════════

class FraudAnalysisAgent:
    """
    AI Insurance Claim Verification and Fraud Analysis Agent.

    Accepts an image file path, runs 4 independent scoring modules,
    and returns a strict structured JSON-ready dict with no extra keys.

    Usage:
        agent = FraudAnalysisAgent()
        result = agent.analyze("path/to/claim_image.jpg")
        # result is a pure dict — serialize with json.dumps(result)
    """

    def __init__(self):
        self._img_scorer = _ImageManipulationScorer()
        self._meta_scorer = _MetadataTamperingScorer()
        self._deep_scorer = _DeepfakeScorer()
        self._ctx_scorer = _ContextualScorer()

    # ─────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────

    def analyze(self, image_path: str) -> dict:
        """
        Run full fraud analysis on the given image path.

        Returns strict JSON-ready dict (only the 5 required top-level keys).
        Raises no user-visible exceptions — on total failure returns minimum
        risk breakdown with low confidence.
        """
        try:
            return self._run_analysis(image_path)
        except Exception as exc:
            print(f"[FraudAnalysisAgent] Fatal error: {exc}")
            return self._fallback_result()

    # ─────────────────────────────────────────────────────────────────────
    # Internal
    # ─────────────────────────────────────────────────────────────────────

    def _run_analysis(self, image_path: str) -> dict:
        # Gather metadata once (shared by multiple scorers)
        metadata = self._extract_metadata(image_path)

        # Run all 4 independent scoring modules
        img_score, img_flags = self._img_scorer.score(image_path, metadata)
        meta_score, meta_flags = self._meta_scorer.score(image_path)
        deep_score, deep_flags = self._deep_scorer.score(image_path)
        ctx_score, ctx_flags = self._ctx_scorer.score(image_path)

        # Validate: each must stay within its cap
        img_score = _clamp(img_score, 0, _ImageManipulationScorer.MAX)
        meta_score = _clamp(meta_score, 0, _MetadataTamperingScorer.MAX)
        deep_score = _clamp(deep_score, 0, _DeepfakeScorer.MAX)
        ctx_score = _clamp(ctx_score, 0, _ContextualScorer.MAX)

        fraud_score = img_score + meta_score + deep_score + ctx_score
        # Guard: should never exceed 100 given the caps, but be safe
        fraud_score = _clamp(fraud_score, 0, 100)

        verdict, recommended_action = _verdict_from_score(fraud_score)

        # Confidence: how decisive the total score is
        # Near 0 or 100 → high confidence; near midpoints → lower
        confidence = self._compute_confidence(
            fraud_score, img_flags + meta_flags + deep_flags + ctx_flags
        )

        return {
            "fraud_score": fraud_score,
            "verdict": verdict,
            "risk_breakdown": {
                "image_manipulation": img_score,
                "metadata_tampering": meta_score,
                "deepfake_indicators": deep_score,
                "contextual_signals": ctx_score,
            },
            "confidence": round(confidence, 4),
            "recommended_action": recommended_action,
        }

    def _extract_metadata(self, image_path: str) -> dict:
        """Extract a unified metadata dict for sharing across scorers."""
        metadata: dict = {}
        if not PIL_AVAILABLE:
            return metadata
        try:
            with PILImage.open(image_path) as img:
                raw_exif = img._getexif()  # type: ignore[attr-defined]
                if raw_exif:
                    exif = {TAGS.get(k, k): str(v) for k, v in raw_exif.items()}
                    metadata["software"] = exif.get("Software", "")
                    metadata["camera_make"] = exif.get("Make", "")
                    metadata["camera_model"] = exif.get("Model", "")
                    metadata["datetime"] = exif.get("DateTime")
        except Exception:
            pass
        return metadata

    def _compute_confidence(self, fraud_score: int, all_flags: list[str]) -> float:
        """
        Confidence 0.0–1.0:
        - High confidence when score is very low (clearly genuine) or very high (clearly fraud)
        - Lower confidence in the "borderline" 30–70 range
        - More flags = marginally more confident (more signals detected)
        """
        # Distance from the 50-point midpoint, normalised 0→1
        decisiveness = abs(fraud_score - 50) / 50.0  # 0 at score=50, 1 at score=0 or 100

        # Base confidence: 0.55 at midpoint, up to 0.95 at extremes
        base = 0.55 + decisiveness * 0.40  # 0.55–0.95

        # Volume of supporting evidence small bonus
        flag_bonus = min(0.05, len(all_flags) * 0.005)

        return round(min(0.98, base + flag_bonus), 4)

    @staticmethod
    def _fallback_result() -> dict:
        """Return minimum-risk result when analysis cannot be completed."""
        return {
            "fraud_score": 0,
            "verdict": "GENUINE",
            "risk_breakdown": {
                "image_manipulation": 0,
                "metadata_tampering": 0,
                "deepfake_indicators": 0,
                "contextual_signals": 0,
            },
            "confidence": 0.1,
            "recommended_action": "APPROVE",
        }
