"""
CNN + ViT Offline Accuracy Test  —  DAY 2
Loads the fine-tuned weights from models/cnn_vit_fraud.pt and runs
the full 3-class inference pipeline over 15 synthetic test images.

Usage:
    python test_accuracy_offline.py
"""

import torch
import torch.nn as nn
import timm
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from torchvision import transforms
import os
import time

# ─────────────────────────────────────────────
# Minimal inline model (no downloads needed)
# ─────────────────────────────────────────────
# Path to fine-tuned weights
WEIGHT_FILE = os.path.join(os.path.dirname(__file__), "models", "cnn_vit_fraud.pt")

CLASS_NAMES = ["GENUINE", "SUSPICIOUS", "FRAUD"]

class CNNViTFraudModel(nn.Module):
    def __init__(self):
        super().__init__()
        # Use pretrained=True backbones (same as training)
        self.cnn = timm.create_model("efficientnet_b0", pretrained=True, num_classes=0, global_pool="avg")
        self.vit = timm.create_model("deit_tiny_patch16_224", pretrained=True, num_classes=0)
        combined = self.cnn.num_features + self.vit.num_features   # 1280 + 192
        self.fusion = nn.Sequential(
            nn.LayerNorm(combined),
            nn.Linear(combined, 256), nn.GELU(), nn.Dropout(0.3),
            nn.Linear(256, 64),       nn.GELU(), nn.Dropout(0.2),
            nn.Linear(64, 3),         # 3-class: GENUINE / SUSPICIOUS / FRAUD
        )
    def forward(self, x):
        return self.fusion(torch.cat([self.cnn(x), self.vit(x)], dim=1))

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def predict(logits):
    """Convert 3-class logits tensor to (status_str, confidence_pct)."""
    probs = torch.softmax(logits, dim=1)[0]
    idx   = probs.argmax().item()
    return CLASS_NAMES[idx], float(probs[idx]) * 100

# ─────────────────────────────────────────────
# Synthetic image generators
# ─────────────────────────────────────────────
def genuine_photo():
    arr = np.random.randint(80, 200, (480, 640, 3), dtype=np.uint8)
    img = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(1))
    draw = ImageDraw.Draw(img)
    for _ in range(20):
        x, y = np.random.randint(0, 600), np.random.randint(0, 440)
        draw.ellipse([x-25,y-25,x+25,y+25], fill=tuple(np.random.randint(60,180,3).tolist()))
    return img

def tampered():
    img = genuine_photo()
    patch = Image.fromarray(np.ones((100,150,3), dtype=np.uint8)*240)
    img.paste(patch, (200,150))
    arr = np.array(img); arr[50:80, 300:400] = [255,0,0]
    return Image.fromarray(arr)

def blurry():
    img = genuine_photo()
    for _ in range(8): img = img.filter(ImageFilter.GaussianBlur(4))
    return img

def deepfake_like():
    base = np.full((224,224,3), 128, dtype=np.uint8)
    for i in range(0, 224, 16):
        for j in range(0, 224, 16):
            v = int(128 + 40*np.sin(i*0.5)*np.cos(j*0.5))
            base[i:i+16, j:j+16] = [v, v//2, 255-v]
    return Image.fromarray(base).filter(ImageFilter.SMOOTH_MORE)

def low_quality():
    img = Image.fromarray(np.random.randint(0,255,(30,30,3), dtype=np.uint8))
    return img.resize((224,224), Image.NEAREST)

def clean_doc():
    img = Image.new("RGB",(640,480),(255,255,255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([40,40,600,440], outline=(0,0,0), width=3)
    for i, txt in enumerate(["INSURANCE CLAIM DOCUMENT","Policy No: INS-2025-004521","Amount: Rs.75,000","Date: 23-Feb-2026"]):
        draw.text((60, 60+i*40), txt, fill=(0,0,0))
    return img

# ─────────────────────────────────────────────
# Test dataset (label, generator, expected)
# ─────────────────────────────────────────────
TESTS = [
    ("Genuine Photo 1",    genuine_photo,  "GENUINE"),
    ("Genuine Photo 2",    genuine_photo,  "GENUINE"),
    ("Genuine Photo 3",    genuine_photo,  "GENUINE"),
    ("Clean Document 1",  clean_doc,      "GENUINE"),
    ("Clean Document 2",  clean_doc,      "GENUINE"),
    ("Tampered Image 1",  tampered,       "FRAUD"),
    ("Tampered Image 2",  tampered,       "FRAUD"),
    ("Tampered Image 3",  tampered,       "FRAUD"),
    ("Blurry Image 1",    blurry,         "SUSPICIOUS"),
    ("Blurry Image 2",    blurry,         "SUSPICIOUS"),
    ("Deepfake-like 1",   deepfake_like,  "FRAUD"),
    ("Deepfake-like 2",   deepfake_like,  "FRAUD"),
    ("Low Quality 1",     low_quality,    "SUSPICIOUS"),
    ("Low Quality 2",     low_quality,    "SUSPICIOUS"),
    ("Low Quality 3",     low_quality,    "SUSPICIOUS"),
]

STATUS_RANK = {"GENUINE":0, "SUSPICIOUS":1, "FRAUD":2}

def run():
    print("="*70)
    print("  CNN + ViT FRAUD DETECTION — DAY 2 FINE-TUNED ACCURACY TEST")
    print("  Model: EfficientNet-B0 + DeiT-Tiny (fine-tuned fusion head)")
    weights_exist = os.path.exists(WEIGHT_FILE)
    print(f"  Weights: {WEIGHT_FILE}")
    print(f"  Status : {'FOUND - loading fine-tuned weights' if weights_exist else 'NOT FOUND - using random weights'}")
    print("="*70)

    print("\n  Loading model …", end="", flush=True)
    t0 = time.time()
    model = CNNViTFraudModel()
    if weights_exist:
        state = torch.load(WEIGHT_FILE, map_location="cpu")
        model.load_state_dict(state)
        print(" fine-tuned weights loaded ✓", end="")
    else:
        print(" using random weights (no .pt file found)", end="")
    model.eval()
    load_time = time.time()-t0
    total_params = sum(p.numel() for p in model.parameters())/1e6
    print(f"  |  {load_time:.1f}s  |  {total_params:.1f}M params\n")

    print(f"  {'#':<3} {'Test Case':<25} {'Expected':<12} {'Predicted':<12} {'Score':>6}  {'Time':>6}  {'Match'}")
    print("  "+"-"*72)

    correct_exact = 0
    correct_close = 0
    cat = {"GENUINE":[0,0], "SUSPICIOUS":[0,0], "FRAUD":[0,0]}
    latencies = []

    with torch.no_grad():
        for idx, (label, gen_fn, expected) in enumerate(TESTS, 1):
            img = gen_fn().convert("RGB")
            tensor = TRANSFORM(img).unsqueeze(0)

            t_s = time.time()
            logits = model(tensor)
            latency = (time.time()-t_s)*1000
            latencies.append(latency)

            predicted, conf = predict(logits)

            exact = (expected == predicted)
            close = abs(STATUS_RANK[expected]-STATUS_RANK.get(predicted,-99)) <= 1

            if exact: correct_exact += 1
            if close: correct_close += 1

            c = cat[expected]; c[1]+=1
            if exact: c[0]+=1

            mark = "[OK]" if exact else ("[~]" if close else "[X]")
            print(f"  {idx:<3} {label:<25} {expected:<12} {predicted:<12} {conf:>5.1f}%  {latency:>5.0f}ms  {mark}")

    total = len(TESTS)
    print("\n"+"="*70)
    print("  RESULTS SUMMARY")
    print("="*70)
    print(f"  Total test cases          : {total}")
    print(f"  Exact match accuracy      : {correct_exact}/{total}  →  {correct_exact/total*100:.1f}%")
    print(f"  Lenient (±1 tier) match   : {correct_close}/{total}  →  {correct_close/total*100:.1f}%")
    print(f"  Avg inference time (CPU)  : {sum(latencies)/len(latencies):.0f} ms per image")
    print(f"  Min / Max latency         : {min(latencies):.0f} ms / {max(latencies):.0f} ms")
    print()
    print("  Per-Category Accuracy:")
    for cat_name, (ok, tot) in cat.items():
        pct = (ok/tot*100) if tot else 0
        bar = "█"*int(pct/5)+"░"*(20-int(pct/5))
        print(f"    {cat_name:<12} {ok}/{tot}  [{bar}]  {pct:.0f}%")
    print()
    print("  DAY 2 STATUS:")
    print(f"  Fine-tuned weights loaded: {os.path.exists(WEIGHT_FILE)}")
    print("  Training used 360 synthetic images, 25 epochs, fusion head only.")
    print("="*70)

if __name__ == "__main__":
    run()
