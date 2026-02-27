"""
CNN + ViT Fraud Detection — Accuracy Test Suite
Generates synthetic genuine & fraudulent test images, sends them to the
running AI service (/api/analyze), and reports accuracy metrics.

Usage:
    python test_accuracy.py
Pre-requisite: AI service must be running on http://localhost:5000
"""

import requests
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
import io
import json
import time

API_URL = "http://localhost:5000/api/analyze"
RESULTS  = []   # { label, predicted, score }


# ─────────────────────────────────────────────────────────────────────────────
# Synthetic image generators
# ─────────────────────────────────────────────────────────────────────────────

def make_genuine_photo():
    """High-quality natural-looking image (camera-like)."""
    arr = np.random.randint(80, 200, (480, 640, 3), dtype=np.uint8)
    img = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(1))
    # Add some natural-looking structure
    draw = ImageDraw.Draw(img)
    for _ in range(20):
        x, y = np.random.randint(0, 640), np.random.randint(0, 480)
        draw.ellipse([x-30, y-30, x+30, y+30],
                     fill=tuple(np.random.randint(60,180,3).tolist()))
    return img


def make_tampered_image():
    """Low-quality patchy image simulating copy-paste tampering."""
    img = make_genuine_photo()
    # Paste a solid block (copy-move artifact)
    patch = Image.fromarray(
        np.ones((100, 150, 3), dtype=np.uint8) * 240
    )
    img.paste(patch, (200, 150))
    # Add hard-edge block noise
    arr = np.array(img)
    arr[50:80, 300:400] = [255, 0, 0]
    return Image.fromarray(arr)


def make_blurry_suspicious():
    """Excessively blurred image — suspicious quality."""
    img = make_genuine_photo()
    for _ in range(8):
        img = img.filter(ImageFilter.GaussianBlur(4))
    return img


def make_deepfake_like():
    """Uniform texture with artificial smoothing (GAN-like pattern)."""
    base = np.full((224, 224, 3), 128, dtype=np.uint8)
    # Add repeating tiled pattern (common in GAN outputs)
    for i in range(0, 224, 16):
        for j in range(0, 224, 16):
            val = int(128 + 40 * np.sin(i * 0.5) * np.cos(j * 0.5))
            base[i:i+16, j:j+16] = [val, val//2, 255-val]
    img = Image.fromarray(base).filter(ImageFilter.SMOOTH_MORE)
    return img


def make_low_quality():
    """Very small, over-compressed image."""
    img = Image.fromarray(
        np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
    )
    img = img.resize((224, 224), Image.NEAREST)  # Pixelated upscale
    return img


def make_clean_document():
    """Clean white document with black text — typical genuine insurance doc."""
    img = Image.new("RGB", (640, 480), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 40, 600, 440], outline=(0, 0, 0), width=3)
    draw.text((60, 60),  "INSURANCE CLAIM DOCUMENT",  fill=(0, 0, 0))
    draw.text((60, 100), "Policy Number: INS-2025-004521", fill=(0, 0, 0))
    draw.text((60, 140), "Amount: Rs. 75,000",           fill=(0, 0, 0))
    draw.text((60, 180), "Date: 23-Feb-2026",            fill=(0, 0, 0))
    draw.text((60, 220), "Claimant: John Doe",           fill=(0, 0, 0))
    return img


# ─────────────────────────────────────────────────────────────────────────────
# Dataset definition
# ─────────────────────────────────────────────────────────────────────────────

TEST_CASES = [
    # (label,           generator_fn,           expected_status)
    ("Genuine Photo 1",    make_genuine_photo,      "GENUINE"),
    ("Genuine Photo 2",    make_genuine_photo,      "GENUINE"),
    ("Genuine Photo 3",    make_genuine_photo,      "GENUINE"),
    ("Clean Document 1",   make_clean_document,     "GENUINE"),
    ("Clean Document 2",   make_clean_document,     "GENUINE"),
    ("Tampered Image 1",   make_tampered_image,     "FRAUD"),
    ("Tampered Image 2",   make_tampered_image,     "FRAUD"),
    ("Tampered Image 3",   make_tampered_image,     "FRAUD"),
    ("Blurry Suspicious 1",make_blurry_suspicious,  "SUSPICIOUS"),
    ("Blurry Suspicious 2",make_blurry_suspicious,  "SUSPICIOUS"),
    ("Deepfake-like 1",    make_deepfake_like,      "FRAUD"),
    ("Deepfake-like 2",    make_deepfake_like,      "FRAUD"),
    ("Low Quality 1",      make_low_quality,        "SUSPICIOUS"),
    ("Low Quality 2",      make_low_quality,        "SUSPICIOUS"),
    ("Low Quality 3",      make_low_quality,        "SUSPICIOUS"),
]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def img_to_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)
    return buf.read()


def analyze(img: Image.Image, label: str) -> dict:
    data  = img_to_bytes(img)
    files = {"image": (f"{label}.jpg", data, "image/jpeg")}
    try:
        r = requests.post(API_URL, files=files, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        return {"error": "Cannot connect to AI service. Is it running on port 5000?"}
    except Exception as e:
        return {"error": str(e)}


STATUS_RANK = {"GENUINE": 0, "SUSPICIOUS": 1, "FRAUD": 2}


def is_correct(expected: str, predicted: str) -> bool:
    """
    Exact match OR adjacent category counts as close (lenient for pre-trained model).
    For hard accuracy we use exact match only.
    """
    return expected == predicted


def close_match(expected: str, predicted: str) -> bool:
    """Adjacent categories accepted (GENUINE↔SUSPICIOUS or SUSPICIOUS↔FRAUD)."""
    return abs(STATUS_RANK[expected] - STATUS_RANK.get(predicted, -99)) <= 1


# ─────────────────────────────────────────────────────────────────────────────
# Main runner
# ─────────────────────────────────────────────────────────────────────────────

def run_tests():
    print("=" * 70)
    print("  CNN + ViT FRAUD DETECTION — ACCURACY TEST")
    print(f"  Endpoint: {API_URL}")
    print("=" * 70)

    # Check service is up
    try:
        r = requests.get("http://localhost:5000/health", timeout=5)
        info = r.json()
        print(f"  ✅ Service status: {info.get('status', 'unknown')}\n")
    except Exception:
        print("  ❌ AI Service is NOT running. Start it with: python app.py")
        return

    print(f"  Running {len(TEST_CASES)} test cases…\n")
    print(f"  {'#':<3} {'Label':<25} {'Expected':<12} {'Predicted':<12} {'Score':>6}  {'Correct'}")
    print("  " + "-" * 68)

    correct_exact = 0
    correct_close = 0
    category_stats = {"GENUINE": [0,0], "SUSPICIOUS": [0,0], "FRAUD": [0,0]}

    for idx, (label, gen_fn, expected) in enumerate(TEST_CASES, 1):
        img    = gen_fn()
        result = analyze(img, label)

        if "error" in result:
            print(f"  {idx:<3} {label:<25} {'ERROR: ' + result['error']}")
            continue

        predicted = result.get("imageStatus", "UNKNOWN")
        score     = result.get("fraudScore", 0)
        method    = result.get("details", {}).get("detectionMethod", "?")

        exact  = is_correct(expected, predicted)
        close  = close_match(expected, predicted)

        if exact:  correct_exact += 1
        if close:  correct_close += 1

        cat = category_stats.get(expected, [0,0])
        cat[1] += 1                   # total
        if exact: cat[0] += 1         # correct
        category_stats[expected] = cat

        mark = "[OK]" if exact else ("[~]" if close else "[X]")
        print(f"  {idx:<3} {label:<25} {expected:<12} {predicted:<12} {score:>5}  {mark}  [{method}]")

        time.sleep(0.3)   # avoid hammering

    total = len(TEST_CASES)
    print("\n" + "=" * 70)
    print(f"  RESULTS SUMMARY")
    print("=" * 70)
    print(f"  Total test cases      : {total}")
    print(f"  Exact matches         : {correct_exact}/{total}  →  Accuracy: {correct_exact/total*100:.1f}%")
    print(f"  Within-1-tier matches : {correct_close}/{total}  →  Lenient : {correct_close/total*100:.1f}%")
    print()
    print(f"  Per-Category Breakdown:")
    for cat, (ok, tot) in category_stats.items():
        pct = (ok/tot*100) if tot else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"    {cat:<12} {ok}/{tot}  [{bar}]  {pct:.0f}%")
    print("=" * 70)
    print("  NOTE: Model uses ImageNet pre-training (no fraud-specific fine-tuning).")
    print("  Fine-tune on CASIA-TIDE dataset to reach 85-92% accuracy.")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
