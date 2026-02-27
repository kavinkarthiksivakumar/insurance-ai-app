"""
Day 2 Training Script — CNN + ViT Fraud Detector
Fine-tunes the EfficientNet-B0 + DeiT-Tiny fusion head on synthetic
insurance-claim images.

Usage:
    python train_model.py

Output:
    models/cnn_vit_fraud.pt   (fine-tuned weights ready for inference)
"""

import os
import time
import random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import timm

# ─── Reproducibility ────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# ─── Config ─────────────────────────────────────────────────────────────────
EPOCHS          = 25
BATCH_SIZE      = 16
LR              = 1e-3
SAMPLES_PER_CLASS = 120          # 120 × 3 classes = 360 images total
IMG_SIZE        = 224
LABEL_MAP       = {"GENUINE": 0, "SUSPICIOUS": 1, "FRAUD": 2}

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "models")
WEIGHT_OUT = os.path.join(MODEL_DIR, "cnn_vit_fraud.pt")

os.makedirs(MODEL_DIR, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[Train] Device: {DEVICE}")

# ─── Model definition (mirrors model_loader.py) ───────────────────────────
class CNNViTFraudModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn = timm.create_model(
            "efficientnet_b0", pretrained=True, num_classes=0, global_pool="avg"
        )
        self.vit = timm.create_model(
            "deit_tiny_patch16_224", pretrained=True, num_classes=0
        )
        combined = self.cnn.num_features + self.vit.num_features  # 1280 + 192
        self.fusion = nn.Sequential(
            nn.LayerNorm(combined),
            nn.Linear(combined, 256), nn.GELU(), nn.Dropout(0.3),
            nn.Linear(256, 64),       nn.GELU(), nn.Dropout(0.2),
            nn.Linear(64, 3),         # 3-class output
        )

    def forward(self, x):
        cnn_f = self.cnn(x)
        vit_f = self.vit(x)
        return self.fusion(torch.cat([cnn_f, vit_f], dim=1))


# ─── Synthetic image generators ──────────────────────────────────────────────
def genuine_photo():
    arr = np.random.randint(80, 200, (480, 640, 3), dtype=np.uint8)
    img = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(random.uniform(0.5, 1.5)))
    draw = ImageDraw.Draw(img)
    for _ in range(random.randint(10, 25)):
        x, y = random.randint(20, 600), random.randint(20, 440)
        r = random.randint(10, 40)
        draw.ellipse([x-r, y-r, x+r, y+r],
                     fill=tuple(np.random.randint(50, 180, 3).tolist()))
    return img


def clean_document():
    bg = random.randint(245, 255)
    img = Image.new("RGB", (640, 480), color=(bg, bg, bg))
    draw = ImageDraw.Draw(img)
    draw.rectangle([30, 30, 610, 450], outline=(0, 0, 0), width=2)
    lines = [
        "INSURANCE CLAIM DOCUMENT",
        f"Policy No : INS-2025-{random.randint(10000, 99999)}",
        f"Amount    : Rs. {random.randint(10000, 500000):,}",
        f"Date      : {random.randint(1,28):02d}-Feb-2026",
        f"Claimant  : Customer {random.randint(100, 999)}",
        "Status    : Submitted",
    ]
    for i, line in enumerate(lines):
        draw.text((60, 60 + i * 45), line, fill=(0, 0, 0))
    return img


def tampered_image():
    img = genuine_photo()
    # Paste a bright solid block (copy-move artifact)
    pw, ph = random.randint(80, 200), random.randint(60, 120)
    patch = Image.fromarray(
        np.ones((ph, pw, 3), dtype=np.uint8) * random.randint(200, 255)
    )
    px, py = random.randint(10, 640 - pw - 10), random.randint(10, 480 - ph - 10)
    img.paste(patch, (px, py))
    # Hard-color block noise
    arr = np.array(img)
    sx, sy = random.randint(0, 550), random.randint(0, 400)
    arr[sy:sy+40, sx:sx+80] = np.random.choice([255, 0], size=3)
    # Add JPEG-like block pattern
    for i in range(0, 480, 32):
        for j in range(0, 640, 32):
            if random.random() < 0.08:
                arr[i:i+32, j:j+32] = np.clip(arr[i:i+32, j:j+32] + 60, 0, 255)
    return Image.fromarray(arr)


def spliced_document():
    base = clean_document()
    # Paste a chunk from another document with different background
    chunk = Image.new("RGB", (200, 80), color=(random.randint(200, 240),) * 3)
    draw = ImageDraw.Draw(chunk)
    draw.text((10, 20), f"MODIFIED: Rs.{random.randint(1, 9)}00,000", fill=(180, 0, 0))
    base.paste(chunk, (180, 200))
    return base


def blurry_suspicious():
    img = genuine_photo()
    blur_passes = random.randint(5, 10)
    for _ in range(blur_passes):
        img = img.filter(ImageFilter.GaussianBlur(random.uniform(3, 5)))
    return img


def low_quality():
    small = random.randint(20, 50)
    img = Image.fromarray(
        np.random.randint(0, 255, (small, small, 3), dtype=np.uint8)
    )
    return img.resize((224, 224), Image.NEAREST)


def deepfake_like():
    base = np.full((224, 224, 3), 128, dtype=np.uint8)
    freq1 = random.uniform(0.3, 0.7)
    freq2 = random.uniform(0.3, 0.7)
    for i in range(0, 224, 16):
        for j in range(0, 224, 16):
            v = int(128 + 40 * np.sin(i * freq1) * np.cos(j * freq2))
            base[i:i+16, j:j+16] = [v, v // 2, 255 - v]
    return Image.fromarray(base).filter(ImageFilter.SMOOTH_MORE)


# ─── Dataset ─────────────────────────────────────────────────────────────────
class SyntheticFraudDataset(Dataset):
    GENERATORS = {
        "GENUINE":    [genuine_photo, clean_document],
        "SUSPICIOUS": [blurry_suspicious, low_quality],
        "FRAUD":      [tampered_image, spliced_document, deepfake_like],
    }

    AUGMENT = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    VAL_TRANSFORM = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    def __init__(self, n_per_class: int = SAMPLES_PER_CLASS, augment: bool = True):
        self.samples = []   # (PIL Image, label_int)
        self.augment = augment
        for label_str, label_int in LABEL_MAP.items():
            gens = self.GENERATORS[label_str]
            for _ in range(n_per_class):
                gen = random.choice(gens)
                img = gen().convert("RGB")
                self.samples.append((img, label_int))
        random.shuffle(self.samples)

    def __len__(self): return len(self.samples)

    def __getitem__(self, idx):
        img, label = self.samples[idx]
        t = self.AUGMENT if self.augment else self.VAL_TRANSFORM
        return t(img), label


# ─── Training loop ───────────────────────────────────────────────────────────
def train():
    print("=" * 65)
    print("  CNN + ViT FRAUD DETECTOR — DAY 2 TRAINING")
    print(f"  Epochs: {EPOCHS}  |  Batch: {BATCH_SIZE}  |  LR: {LR}")
    print(f"  Samples: {SAMPLES_PER_CLASS * 3} total  ({SAMPLES_PER_CLASS} per class)")
    print("=" * 65)

    # ── Build dataset & loaders ───────────────────────────────────────────
    print("\n[1/4] Generating synthetic dataset …", flush=True)
    dataset = SyntheticFraudDataset(n_per_class=SAMPLES_PER_CLASS, augment=True)
    val_set = SyntheticFraudDataset(n_per_class=30, augment=False)

    train_loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
    val_loader   = DataLoader(val_set,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    print(f"    Train: {len(dataset)} images  |  Val: {len(val_set)} images  ✓")

    # ── Build model ───────────────────────────────────────────────────────
    print("\n[2/4] Loading pretrained EfficientNet-B0 + DeiT-Tiny …", flush=True)
    model = CNNViTFraudModel().to(DEVICE)

    # Freeze backbones — only train the fusion head
    for p in model.cnn.parameters(): p.requires_grad = False
    for p in model.vit.parameters(): p.requires_grad = False

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total     = sum(p.numel() for p in model.parameters())
    print(f"    Trainable params: {trainable:,} / {total:,}  (fusion head only)  ✓")

    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()), lr=LR
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    criterion = nn.CrossEntropyLoss()

    # ── Training epochs ───────────────────────────────────────────────────
    print(f"\n[3/4] Training for {EPOCHS} epochs …\n")
    print(f"  {'Ep':>3}  {'Loss':>7}  {'Train Acc':>9}  {'Val Acc':>7}  {'Time':>6}")
    print("  " + "-" * 42)

    best_val_acc = 0.0
    best_state   = None
    t_start      = time.time()

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        ep_t = time.time()

        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            logits = model(imgs)
            loss   = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * imgs.size(0)
            preds  = logits.argmax(dim=1)
            correct += (preds == labels).sum().item()

        scheduler.step()
        avg_loss  = total_loss / len(dataset)
        train_acc = correct / len(dataset) * 100

        # Validation
        model.eval()
        val_correct = 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                preds = model(imgs).argmax(dim=1)
                val_correct += (preds == labels).sum().item()
        val_acc = val_correct / len(val_set) * 100

        ep_time = time.time() - ep_t
        print(f"  {epoch:>3}  {avg_loss:>7.4f}  {train_acc:>8.1f}%  {val_acc:>6.1f}%  {ep_time:>5.1f}s")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state   = {k: v.clone() for k, v in model.state_dict().items()}

    total_time = time.time() - t_start
    print(f"\n  Best validation accuracy: {best_val_acc:.1f}%")
    print(f"  Total training time     : {total_time:.0f}s")

    # ── Save weights ──────────────────────────────────────────────────────
    print(f"\n[4/4] Saving best weights → {WEIGHT_OUT} …", flush=True)
    torch.save(best_state, WEIGHT_OUT)
    print(f"    Saved  ✓  ({os.path.getsize(WEIGHT_OUT) / 1e6:.1f} MB)")

    print("\n" + "=" * 65)
    print("  TRAINING COMPLETE")
    print(f"  Best Val Accuracy : {best_val_acc:.1f}%")
    print(f"  Weights saved to  : {WEIGHT_OUT}")
    print("  Run test_accuracy_offline.py to verify inference accuracy.")
    print("=" * 65)


if __name__ == "__main__":
    train()
