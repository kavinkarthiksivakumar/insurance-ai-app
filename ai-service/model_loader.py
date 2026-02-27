"""
CNN + ViT Hybrid Model Loader
EfficientNet-B0 (CNN, ~21MB)  +  DeiT-Tiny (ViT, ~22MB)
Fast-loading, CPU-friendly, pre-trained on ImageNet.
Architecture is identical to the B4+Small variant — just lighter weights.
"""

import torch
import torch.nn as nn
import timm
import os

# ── Device ──────────────────────────────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Paths ────────────────────────────────────────────────────────────────────
MODEL_DIR   = os.path.join(os.path.dirname(__file__), "models")
WEIGHT_FILE = os.path.join(MODEL_DIR, "cnn_vit_fraud.pt")

# ── Hybrid Architecture ───────────────────────────────────────────────────────
class CNNViTFraudModel(nn.Module):
    """
    Two-stream hybrid (lightweight variant):
      • Stream 1: EfficientNet-B0  (~21 MB) — local artifact detection
        (pixel tampering, JPEG artifacts, copy-move, splicing)
      • Stream 2: DeiT-Tiny/16    (~22 MB) — global context detection
        (lighting anomalies, structural inconsistencies, deepfakes)
      • Fusion MLP: combines both → GENUINE | SUSPICIOUS | FRAUD
    """

    def __init__(self):
        super().__init__()

        # CNN Stream: EfficientNet-B0 (1280 features)
        self.cnn = timm.create_model(
            "efficientnet_b0",
            pretrained=True,
            num_classes=0,
            global_pool="avg"
        )
        cnn_feat = self.cnn.num_features          # 1280

        # ViT Stream: DeiT-Tiny patch16 224 (192 features)
        self.vit = timm.create_model(
            "deit_tiny_patch16_224",
            pretrained=True,
            num_classes=0
        )
        vit_feat = self.vit.num_features          # 192

        # Fusion head
        combined = cnn_feat + vit_feat            # 1472
        self.fusion = nn.Sequential(
            nn.LayerNorm(combined),
            nn.Linear(combined, 256),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(256, 64),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(64, 3),
        )

    def forward(self, x):
        cnn_feat  = self.cnn(x)
        vit_feat  = self.vit(x)
        combined  = torch.cat([cnn_feat, vit_feat], dim=1)
        return self.fusion(combined)              # (B, 3) logits


# ── Singleton Loader ──────────────────────────────────────────────────────────
_model_instance = None


def get_model() -> CNNViTFraudModel:
    global _model_instance
    if _model_instance is not None:
        return _model_instance

    print("[ModelLoader] Building EfficientNet-B0 + DeiT-Tiny hybrid …")
    model = CNNViTFraudModel().to(DEVICE)

    if os.path.exists(WEIGHT_FILE):
        print(f"[ModelLoader] Loading fine-tuned weights: {WEIGHT_FILE}")
        state = torch.load(WEIGHT_FILE, map_location=DEVICE)
        model.load_state_dict(state)
        print("[ModelLoader] Fine-tuned weights loaded ✓")
    else:
        print("[ModelLoader] Using ImageNet pre-training (no fine-tuned weights found).")

    model.eval()
    _model_instance = model
    print("[ModelLoader] Model ready ✓")
    return _model_instance
