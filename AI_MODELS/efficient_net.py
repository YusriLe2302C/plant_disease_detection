# ================= IMPORTS =================
import os
import json
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from timm import create_model

# ================= CONFIG =================
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

DATA_DIR = "dataset"

if not os.path.exists(DATA_DIR):
    raise FileNotFoundError(
        "Dataset folder not found! Create 'dataset/' with subfolders for each class."
    )

# Remove non-class folders
EXCLUDE_DIRS = {"color", "grayscale", "plantvillage_dataset", "segmented"}
for exclude_dir in EXCLUDE_DIRS:
    exclude_path = os.path.join(DATA_DIR, exclude_dir)
    if os.path.exists(exclude_path):
        import shutil
        shutil.rmtree(exclude_path)
        print(f"Removed: {exclude_dir}")

print(f"🔥 Using device: {DEVICE}")

# ================= TRANSFORMS =================
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(20),
    transforms.RandomResizedCrop(IMG_SIZE, scale=(0.8, 1.0)),
    transforms.ToTensor(),
])

val_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
])

# ================= DATASET =================
train_dataset = datasets.ImageFolder(DATA_DIR, transform=train_transform)

num_classes = len(train_dataset.classes)
if num_classes == 0:
    raise ValueError("No classes found in dataset!")

print("Class mapping:", train_dataset.class_to_idx)

# split train/val (80/20)
val_size = int(0.2 * len(train_dataset))
train_size = len(train_dataset) - val_size
train_dataset, val_dataset = torch.utils.data.random_split(
    train_dataset, [train_size, val_size]
)

# apply val transform properly
val_dataset.dataset.transform = val_transform

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

# ================= MODEL =================
model = create_model(
    "efficientnet_b0",
    pretrained=True,
    num_classes=num_classes
)

# freeze backbone (like your TF code)
for param in model.parameters():
    param.requires_grad = False

# unfreeze classifier
for param in model.get_classifier().parameters():
    param.requires_grad = True

model = model.to(DEVICE)

# ================= LOSS / OPT =================
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",
    factor=0.3,
    patience=3,
    min_lr=1e-6
)

# ================= EARLY STOP =================
best_val_acc = 0
patience = 5
patience_counter = 0
best_weights = copy.deepcopy(model.state_dict())

# ================= TRAIN LOOP =================
for epoch in range(EPOCHS):
    print(f"\n{'='*60}")
    print(f"🚀 Epoch {epoch+1}/{EPOCHS}")
    print(f"{'='*60}")

    # ===== TRAIN =====
    model.train()
    train_loss = 0
    train_correct = 0
    train_total = 0

    for batch_idx, (images, labels) in enumerate(train_loader):
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        train_loss += loss.item()
        _, preds = torch.max(outputs, 1)
        train_correct += (preds == labels).sum().item()
        train_total += labels.size(0)

        # Progress indicator
        if (batch_idx + 1) % 10 == 0:
            print(f"  Batch [{batch_idx+1}/{len(train_loader)}] - Loss: {loss.item():.4f}")

    train_acc = train_correct / train_total

    # ===== VALIDATION =====
    model.eval()
    val_loss = 0
    val_correct = 0
    val_total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)

            val_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            val_correct += (preds == labels).sum().item()
            val_total += labels.size(0)

    val_acc = val_correct / val_total
    scheduler.step(val_loss)

    print(f"\n📊 Results:")
    print(f"  Train Loss: {train_loss/len(train_loader):.4f} | Train Acc: {train_acc:.4f}")
    print(f"  Val Loss: {val_loss/len(val_loader):.4f} | Val Acc: {val_acc:.4f}")

    # ===== CHECKPOINT =====
    if val_acc > best_val_acc:
        print(f"\n✅ New best model! Val Acc improved from {best_val_acc:.4f} to {val_acc:.4f}")
        best_val_acc = val_acc
        best_weights = copy.deepcopy(model.state_dict())
        torch.save(best_weights, "best_model.pt")
        patience_counter = 0
    else:
        patience_counter += 1
        print(f"\n⏳ No improvement. Patience: {patience_counter}/{patience}")

    # ===== EARLY STOP =====
    if patience_counter >= patience:
        print(f"\n🛑 Early stopping triggered at epoch {epoch+1}")
        break

# ================= SAVE FINAL =================
model.load_state_dict(best_weights)
torch.save(model.state_dict(), "plant_disease_efficientnet.pt")

# save class mapping
with open("class_indices.json", "w") as f:
    json.dump(train_dataset.dataset.class_to_idx, f, indent=2)

print("\n✅ Training complete!")
print("✅ Model saved: plant_disease_efficientnet.pt")
print("✅ Classes saved: class_indices.json")