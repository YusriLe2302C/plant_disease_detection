import torch
import timm
import os
import json
from torch import nn, optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split
from sklearn.metrics import accuracy_score

def main():

    print("\n===== SYSTEM CHECK =====")
    print("PyTorch:", torch.__version__)
    print("GPU available:", torch.cuda.is_available())
    print("GPU name:", torch.cuda.get_device_name(0))
    print("========================\n")

    DATASET_PATH = r"C:\Users\Lenovo\Coding\Plant_Disease\project\FINAL_DATASET"
    BATCH_SIZE = 32
    EPOCHS = 50
    IMG_SIZE = 224
    EARLY_STOP_PATIENCE = 5

    device = torch.device("cuda")

    # ================= TRANSFORMS =================
    train_tf = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    val_tf = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    print("Loading dataset...")
    dataset = datasets.ImageFolder(DATASET_PATH)

    # 🔥 SAVE CORRECT CLASS INDICES
    class_indices = {cls: idx for idx, cls in enumerate(dataset.classes)}
    with open("class_indices.json", "w") as f:
        json.dump(class_indices, f, indent=4)

    print("class_indices.json updated")
    print("Total images:", len(dataset))
    print("Total classes:", len(dataset.classes))

    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_ds.dataset.transform = train_tf
    val_ds.dataset.transform = val_tf

    train_loader = DataLoader(
        train_ds,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    print("\nLoading EfficientNet...")
    model = timm.create_model(
        "efficientnet_b0",
        pretrained=True,
        num_classes=len(dataset.classes)
    )

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0007)

    best_acc = 0
    patience_counter = 0

    # ===================================================
    # 🚀 TRAINING LOOP
    # ===================================================
    for epoch in range(EPOCHS):

        print("\n" + "="*50)
        print(f"🚀 EPOCH {epoch+1}/{EPOCHS}")
        print("="*50)

        # ================= TRAIN =================
        model.train()
        running_loss = 0
        train_preds = []
        train_labels = []

        total_batches = len(train_loader)
        print_every = total_batches // 10

        for batch_idx, (imgs, labels) in enumerate(train_loader):

            imgs, labels = imgs.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

            preds = torch.argmax(outputs, 1)
            train_preds.extend(preds.cpu().numpy())
            train_labels.extend(labels.cpu().numpy())

            if (batch_idx + 1) % print_every == 0:
                print(f"[{batch_idx+1}/{total_batches}] Loss: {loss.item():.4f}")

        train_acc = accuracy_score(train_labels, train_preds)

        # ================= VALIDATION =================
        model.eval()
        val_preds = []
        val_labels = []

        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs = imgs.to(device)
                outputs = model(imgs)
                preds = torch.argmax(outputs, 1)

                val_preds.extend(preds.cpu().numpy())
                val_labels.extend(labels.numpy())

        val_acc = accuracy_score(val_labels, val_preds)

        print("-"*50)
        print(f"📉 Epoch Loss: {running_loss:.2f}")
        print(f"🎯 Train Accuracy: {train_acc*100:.2f}%")
        print(f"🧪 Validation Accuracy: {val_acc*100:.2f}%")
        print("-"*50)

        # ================= EARLY STOP =================
        if val_acc > best_acc:
            best_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), "best_model.pth")
            print("🔥 BEST MODEL SAVED")
        else:
            patience_counter += 1
            print(f"No improvement. Patience: {patience_counter}")

        if patience_counter >= EARLY_STOP_PATIENCE:
            print("\n⛔ EARLY STOPPING TRIGGERED")
            break

    torch.save(model.state_dict(), "final_model.pth")

    print("\n===== TRAINING COMPLETE =====")
    print("Best Validation Accuracy:", round(best_acc * 100, 2), "%")


if __name__ == "__main__":
    main()