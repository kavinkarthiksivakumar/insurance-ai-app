"""
Day 3 Training Script — CNN + ViT Fraud Detector
Loads Day 2 weights and continues fine-tuning with:
  • Unfrozen last 2 backbone layers (both CNN + ViT)
  • Richer fraud generators (colour-shift, text-overlay, erase-block)
  • Lower LR (1e-4) + heavier augmentation to learn copy-paste artifacts
  • 20 epochs — saves best val checkpoint to models/cnn_vit_fraud.pt

Usage:
    python train_model_day3.py
"""

import os, time, random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import timm

# ─── Reproducibility ────────────────────────────────────────────────────────
SEED = 7
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)

# ─── Config ─────────────────────────────────────────────────────────────────
EPOCHS            = 20
BATCH_SIZE        = 8          # smaller batch — more gradient updates
LR                = 1e-4       # lower LR for fine-tuning backbone
SAMPLES_PER_CLASS = 150        # 450 total
IMG_SIZE          = 224
LABEL_MAP         = {"GENUINE": 0, "SUSPICIOUS": 1, "FRAUD": 2}

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "models")
WEIGHT_IN  = os.path.join(MODEL_DIR, "cnn_vit_fraud.pt")   # Day 2 checkpoint
WEIGHT_OUT = os.path.join(MODEL_DIR, "cnn_vit_fraud.pt")   # overwrite with best

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[Day3] Device: {DEVICE}")

# ─── Model (same architecture as Day 2) ─────────────────────────────────────
class CNNViTFraudModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn = timm.create_model(
            "efficientnet_b0", pretrained=True, num_classes=0, global_pool="avg"
        )
        self.vit = timm.create_model(
            "deit_tiny_patch16_224", pretrained=True, num_classes=0
        )
        combined = self.cnn.num_features + self.vit.num_features
        self.fusion = nn.Sequential(
            nn.LayerNorm(combined),
            nn.Linear(combined, 256), nn.GELU(), nn.Dropout(0.3),
            nn.Linear(256, 64),       nn.GELU(), nn.Dropout(0.2),
            nn.Linear(64, 3),
        )

    def forward(self, x):
        return self.fusion(torch.cat([self.cnn(x), self.vit(x)], dim=1))


# ─── Synthetic image generators ─────────────────────────────────────────────

def genuine_photo():
    arr = np.random.randint(80, 200, (480, 640, 3), dtype=np.uint8)
    img = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(random.uniform(0.5, 1.5)))
    d = ImageDraw.Draw(img)
    for _ in range(random.randint(10, 25)):
        x, y = random.randint(20, 600), random.randint(20, 440)
        r = random.randint(10, 40)
        d.ellipse([x-r, y-r, x+r, y+r],
                  fill=tuple(np.random.randint(50, 180, 3).tolist()))
    return img


def clean_document():
    bg = random.randint(245, 255)
    img = Image.new("RGB", (640, 480), (bg, bg, bg))
    d = ImageDraw.Draw(img)
    d.rectangle([30, 30, 610, 450], outline=(0, 0, 0), width=2)
    lines = [
        "INSURANCE CLAIM DOCUMENT",
        f"Policy No : INS-2025-{random.randint(10000,99999)}",
        f"Amount    : Rs. {random.randint(10000,500000):,}",
        f"Date      : {random.randint(1,28):02d}-Feb-2026",
        f"Claimant  : Customer {random.randint(100,999)}",
    ]
    for i, line in enumerate(lines):
        d.text((60, 60 + i * 45), line, fill=(0, 0, 0))
    return img


# ── FRAUD generators (richer set for Day 3) ──────────────────────────────────

def tampered_solid_block():
    """Copy-move: solid white/colour block pasted on genuine photo."""
    img = genuine_photo()
    pw, ph = random.randint(80, 200), random.randint(60, 120)
    patch = Image.fromarray(
        np.ones((ph, pw, 3), dtype=np.uint8) * random.randint(220, 255)
    )
    img.paste(patch, (random.randint(10, 640-pw-10), random.randint(10, 480-ph-10)))
    arr = np.array(img)
    sx, sy = random.randint(0, 550), random.randint(0, 400)
    arr[sy:sy+40, sx:sx+80] = [255, 0, 0]
    return Image.fromarray(arr)


def tampered_colour_shift():
    """Apply extreme channel colour shift to a region — visible splice boundary."""
    img = genuine_photo().copy()
    arr = np.array(img).astype(np.int16)
    # Shift a rectangle heavily green
    rx, ry = random.randint(50, 400), random.randint(50, 300)
    rw, rh = random.randint(100, 200), random.randint(80, 150)
    arr[ry:ry+rh, rx:rx+rw, 1] = np.clip(arr[ry:ry+rh, rx:rx+rw, 1] + 120, 0, 255)
    arr[ry:ry+rh, rx:rx+rw, 0] = np.clip(arr[ry:ry+rh, rx:rx+rw, 0] - 60, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


def tampered_erased_text():
    """White-erase a section of a document and overwrite with suspicious text."""
    img = clean_document()
    d = ImageDraw.Draw(img)
    # White block over original text
    ex, ey = random.randint(50, 300), random.randint(100, 300)
    d.rectangle([ex, ey, ex+260, ey+45], fill=(255, 255, 255))
    # Write falsified amount in different style
    d.text((ex+5, ey+10),
           f"Amount : Rs. {random.randint(500000,9999999):,}  [EDITED]",
           fill=(200, 0, 0))
    return img


def tampered_text_overlay():
    """Stamp 'PAID'/'APPROVED' text over a document (watermark fraud)."""
    img = clean_document()
    d = ImageDraw.Draw(img)
    stamp = random.choice(["PAID", "APPROVED", "CERTIFIED"])
    # Draw large rotated-like diagonal stamp
    for dx, dy in [(0,0),(2,2)]:
        d.text((180+dx, 200+dy), stamp, fill=(180, 0, 0))
    return img


def tampered_jpeg_block():
    """Over-compressed blocks (common in copy-paste forgeries)."""
    img = genuine_photo()
    arr = np.array(img)
    for _ in range(random.randint(4, 8)):
        bx = random.randint(0, 600) // 8 * 8
        by = random.randint(0, 440) // 8 * 8
        block = arr[by:by+32, bx:bx+32].copy()
        block = (block // 64) * 64   # quantise heavily
        arr[by:by+32, bx:bx+32] = block
    return Image.fromarray(arr)


def deepfake_like():
    base = np.full((224, 224, 3), 128, dtype=np.uint8)
    f1, f2 = random.uniform(0.3, 0.7), random.uniform(0.3, 0.7)
    for i in range(0, 224, 16):
        for j in range(0, 224, 16):
            v = int(128 + 40 * np.sin(i*f1) * np.cos(j*f2))
            base[i:i+16, j:j+16] = [v, v//2, 255-v]
    return Image.fromarray(base).filter(ImageFilter.SMOOTH_MORE)


def spliced_document():
    img = clean_document()
    chunk = Image.new("RGB", (220, 80), (random.randint(220, 250),)*3)
    d = ImageDraw.Draw(chunk)
    d.text((10, 20), f"MODIFIED: Rs.{random.randint(1,9)}00,000", fill=(180, 0, 0))
    img.paste(chunk, (random.randint(100, 350), random.randint(150, 300)))
    return img


# ── SUSPICIOUS generators ──────────────────────────────────────────────────

def blurry_suspicious():
    img = genuine_photo()
    for _ in range(random.randint(5, 10)):
        img = img.filter(ImageFilter.GaussianBlur(random.uniform(3, 5)))
    return img


def low_quality():
    s = random.randint(20, 50)
    return Image.fromarray(
        np.random.randint(0, 255, (s, s, 3), dtype=np.uint8)
    ).resize((224, 224), Image.NEAREST)


# ─── Dataset ─────────────────────────────────────────────────────────────────
class SyntheticFraudDataset(Dataset):
    GENERATORS = {
        "GENUINE":    [genuine_photo, clean_document],
        "SUSPICIOUS": [blurry_suspicious, low_quality],
        "FRAUD":      [tampered_solid_block, tampered_colour_shift,
                       tampered_erased_text, tampered_text_overlay,
                       tampered_jpeg_block, deepfake_like, spliced_document],
    }

    AUGMENT = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.1),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    VAL_TRANSFORM = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    def __init__(self, n_per_class=SAMPLES_PER_CLASS, augment=True):
        self.samples = []
        self.augment = augment
        for label_str, label_int in LABEL_MAP.items():
            gens = self.GENERATORS[label_str]
            for _ in range(n_per_class):
                img = random.choice(gens)().convert("RGB")
                self.samples.append((img, label_int))
        random.shuffle(self.samples)

    def __len__(self): return len(self.samples)

    def __getitem__(self, idx):
        img, label = self.samples[idx]
        t = self.AUGMENT if self.augment else self.VAL_TRANSFORM
        return t(img), label


# ─── Unfreeze helper ─────────────────────────────────────────────────────────
def unfreeze_last_n_cnn(model, n=2):
    """Unfreeze the last n blocks of EfficientNet-B0."""
    blocks = list(model.cnn.blocks)
    for block in blocks[-n:]:
        for p in block.parameters():
            p.requires_grad = True


def unfreeze_last_n_vit(model, n=2):
    """Unfreeze the last n transformer blocks of DeiT-Tiny."""
    blocks = list(model.vit.blocks)
    for block in blocks[-n:]:
        for p in block.parameters():
            p.requires_grad = True


# ─── Training loop ────────────────────────────────────────────────────────────
def train():
    print("=" * 65)
    print("  CNN + ViT FRAUD DETECTOR — DAY 3 TRAINING")
    print(f"  Epochs: {EPOCHS}  |  Batch: {BATCH_SIZE}  |  LR: {LR}")
    print(f"  Samples: {SAMPLES_PER_CLASS*3} total  |  Fraud types: 7")
    print("=" * 65)

    # ── Dataset ───────────────────────────────────────────────────────────
    print("\n[1/4] Generating Day 3 synthetic dataset …", flush=True)
    dataset = SyntheticFraudDataset(n_per_class=SAMPLES_PER_CLASS, augment=True)
    val_set = SyntheticFraudDataset(n_per_class=40, augment=False)
    train_loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
    val_loader   = DataLoader(val_set,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    print(f"    Train: {len(dataset)}  |  Val: {len(val_set)}  ✓")

    # ── Load Day 2 model ──────────────────────────────────────────────────
    print("\n[2/4] Loading Day 2 weights …", flush=True)
    model = CNNViTFraudModel().to(DEVICE)
    if os.path.exists(WEIGHT_IN):
        state = torch.load(WEIGHT_IN, map_location=DEVICE)
        model.load_state_dict(state)
        print(f"    Loaded: {WEIGHT_IN}  ✓")
    else:
        print("    WARNING: Day 2 weights not found — starting from ImageNet pre-training")

    # ── Unfreeze last backbone layers ─────────────────────────────────────
    # First freeze everything
    for p in model.parameters(): p.requires_grad = False
    # Unfreeze fusion head
    for p in model.fusion.parameters(): p.requires_grad = True
    # Unfreeze last 2 CNN blocks + last 2 ViT blocks
    unfreeze_last_n_cnn(model, n=2)
    unfreeze_last_n_vit(model, n=2)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total     = sum(p.numel() for p in model.parameters())
    print(f"    Trainable params: {trainable:,} / {total:,}  (fusion + last backbone layers)  ✓")

    # Different LR for backbone vs head
    optimizer = torch.optim.Adam([
        {"params": model.fusion.parameters(),           "lr": LR},
        {"params": filter(lambda p: p.requires_grad and p not in set(model.fusion.parameters()), model.parameters()), "lr": LR * 0.1},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    criterion = nn.CrossEntropyLoss()

    # ── Epochs ────────────────────────────────────────────────────────────
    print(f"\n[3/4] Training for {EPOCHS} epochs …\n")
    print(f"  {'Ep':>3}  {'Loss':>7}  {'Train Acc':>9}  {'Val Acc':>7}  {'Time':>6}")
    print("  " + "-" * 42)

    best_val  = 0.0
    best_state = None
    t_start   = time.time()

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0; correct = 0
        ep_t = time.time()

        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            loss = criterion(model(imgs), labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct    += (model(imgs.detach()).argmax(1) == labels).sum().item()

        scheduler.step()
        avg_loss  = total_loss / len(dataset)
        train_acc = correct / len(dataset) * 100

        model.eval()
        val_correct = 0
        per_class   = {0:[0,0], 1:[0,0], 2:[0,0]}
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                preds = model(imgs).argmax(1)
                for p, l in zip(preds, labels):
                    per_class[l.item()][1] += 1
                    if p == l: per_class[l.item()][0] += 1
                val_correct += (preds == labels).sum().item()
        val_acc = val_correct / len(val_set) * 100
        fraud_acc = (per_class[2][0]/per_class[2][1]*100) if per_class[2][1] else 0

        ep_time = time.time() - ep_t
        print(f"  {epoch:>3}  {avg_loss:>7.4f}  {train_acc:>8.1f}%  {val_acc:>6.1f}%  {ep_time:>5.1f}s  [FRAUD:{fraud_acc:.0f}%]")

        if val_acc > best_val:
            best_val   = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

    print(f"\n  Best validation accuracy: {best_val:.1f}%")
    print(f"  Total time: {time.time()-t_start:.0f}s")

    # ── Save ──────────────────────────────────────────────────────────────
    print(f"\n[4/4] Saving best weights → {WEIGHT_OUT} …", flush=True)
    torch.save(best_state, WEIGHT_OUT)
    print(f"    Saved  ✓  ({os.path.getsize(WEIGHT_OUT)/1e6:.1f} MB)")

    print("\n" + "=" * 65)
    print(f"  DAY 3 TRAINING COMPLETE")
    print(f"  Best Val Accuracy : {best_val:.1f}%")
    print(f"  Weights saved to  : {WEIGHT_OUT}")
    print(f"  Run the accuracy check to see per-class improvement.")
    print("=" * 65)


if __name__ == "__main__":
    train()
