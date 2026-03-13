import os
import torch
import timm
import json
import numpy as np

from torch import nn, optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score


# ================= TOP3 ACCURACY =================

def top3_accuracy(outputs, labels):

    top3 = torch.topk(outputs, 3, dim=1).indices
    correct = 0

    for i in range(labels.size(0)):
        if labels[i] in top3[i]:
            correct += 1

    return correct


# ================= DATASET REPORT =================

def dataset_report(dataset, title):

    print("\n===== {} DATASET REPORT =====".format(title))

    class_count = {cls:0 for cls in dataset.classes}

    for path, label in dataset.samples:
        class_name = dataset.classes[label]
        class_count[class_name] += 1

    total = 0

    for cls, count in class_count.items():
        print(f"{cls} : {count}")
        total += count

    print("------------------------------")
    print("Total Classes :", len(class_count))
    print("Total Images  :", total)
    print("------------------------------\n")

    return class_count


# ================= CLASS WEIGHTS =================

def compute_class_weights(class_count, classes):

    counts = np.array([class_count[c] for c in classes])

    weights = 1.0 / counts
    weights = weights / weights.sum() * len(classes)

    return torch.tensor(weights, dtype=torch.float)


# ================= MAIN =================

def main():

    print("\n===== SYSTEM CHECK =====")
    print("PyTorch:", torch.__version__)
    print("GPU available:", torch.cuda.is_available())

    if torch.cuda.is_available():
        print("GPU name:", torch.cuda.get_device_name(0))

    print("========================\n")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    DATASET_DIR = os.path.join(BASE_DIR, "processed_dataset")

    TRAIN_PATH = os.path.join(DATASET_DIR, "train")
    TEST_PATH = os.path.join(DATASET_DIR, "test")

    BATCH_SIZE = 32
    EPOCHS = 80
    IMG_SIZE = 224
    EARLY_STOP_PATIENCE = 8

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


    # ================= TRANSFORMS =================

    train_tf = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(25),
        transforms.ColorJitter(brightness=0.3, contrast=0.3),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485,0.456,0.406],
            std=[0.229,0.224,0.225]
        )
    ])

    val_tf = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485,0.456,0.406],
            std=[0.229,0.224,0.225]
        )
    ])


    # ================= LOAD DATA =================

    print("Loading datasets...\n")

    train_dataset = datasets.ImageFolder(TRAIN_PATH, transform=train_tf)
    val_dataset = datasets.ImageFolder(TEST_PATH, transform=val_tf)

    print("Train images:", len(train_dataset))
    print("Test images:", len(val_dataset))
    print("Classes:", len(train_dataset.classes))


    # ================= DATASET REPORT =================

    train_count = dataset_report(train_dataset, "TRAIN")
    test_count = dataset_report(val_dataset, "TEST")


    # ================= CLASS INDICES =================

    class_indices = {cls: idx for idx, cls in enumerate(train_dataset.classes)}

    with open(os.path.join(BASE_DIR, "class_indices.json"), "w") as f:
        json.dump(class_indices, f, indent=4)

    print("class_indices.json saved\n")


    # ================= CLASS WEIGHTS =================

    class_weights = compute_class_weights(train_count, train_dataset.classes)

    print("===== CLASS WEIGHTS =====")

    for i, cls in enumerate(train_dataset.classes):
        print(f"{cls} -> {class_weights[i]:.4f}")

    print("=========================\n")

    class_weights = class_weights.to(device)


    # ================= DATALOADER =================

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )


    # ================= MODEL =================

    print("Loading EfficientNet-B0...\n")

    model = timm.create_model(
        "efficientnet_b0",
        pretrained=True,
        num_classes=len(train_dataset.classes)
    )

    model = model.to(device)


    # ================= LOSS =================

    criterion = nn.CrossEntropyLoss(weight=class_weights)


    # ================= OPTIMIZER =================

    optimizer = optim.Adam(
        model.parameters(),
        lr=0.0007
    )


    best_top1 = 0
    best_top3 = 0
    patience_counter = 0


    # ================= TRAINING LOOP =================

    for epoch in range(EPOCHS):

        print("\n" + "="*50)
        print(f"EPOCH {epoch+1}/{EPOCHS}")
        print("="*50)


        # ===== TRAIN =====

        model.train()

        running_loss = 0
        train_preds = []
        train_labels = []

        for imgs, labels in train_loader:

            imgs = imgs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            outputs = model(imgs)

            loss = criterion(outputs, labels)

            loss.backward()

            optimizer.step()

            running_loss += loss.item()

            preds = torch.argmax(outputs, 1)

            train_preds.extend(preds.cpu().numpy())
            train_labels.extend(labels.cpu().numpy())


        train_acc = accuracy_score(train_labels, train_preds)


        # ===== VALIDATION =====

        model.eval()

        val_preds = []
        val_labels = []
        top3_correct = 0

        with torch.no_grad():

            for imgs, labels in val_loader:

                imgs = imgs.to(device)
                labels = labels.to(device)

                outputs = model(imgs)

                preds = torch.argmax(outputs, 1)

                val_preds.extend(preds.cpu().numpy())
                val_labels.extend(labels.cpu().numpy())

                top3_correct += top3_accuracy(outputs, labels)


        val_acc = accuracy_score(val_labels, val_preds)

        top3 = top3_correct / len(val_dataset)


        print("-"*50)
        print(f"Loss: {running_loss/len(train_loader):.4f}")
        print(f"Train Accuracy: {train_acc*100:.2f}%")
        print(f"Top-1 Accuracy: {val_acc*100:.2f}%")
        print(f"Top-3 Accuracy: {top3*100:.2f}%")
        print("-"*50)


        # ===== SAVE BEST TOP1 =====

        if val_acc > best_top1:

            best_top1 = val_acc
            patience_counter = 0

            torch.save(
                model.state_dict(),
                os.path.join(BASE_DIR, "best_model_top1.pth")
            )

            print("BEST TOP-1 MODEL SAVED")

        else:

            patience_counter += 1
            print("No improvement Top-1. Patience:", patience_counter)


        # ===== SAVE BEST TOP3 =====

        if top3 > best_top3:

            best_top3 = top3

            torch.save(
                model.state_dict(),
                os.path.join(BASE_DIR, "best_model_top3.pth")
            )

            print("BEST TOP-3 MODEL SAVED")


        # ===== EARLY STOP =====

        if patience_counter >= EARLY_STOP_PATIENCE:

            print("\nEARLY STOPPING TRIGGERED")
            break


    torch.save(
        model.state_dict(),
        os.path.join(BASE_DIR, "final_model.pth")
    )

    print("\n===== TRAINING COMPLETE =====")
    print("Best Top-1 Accuracy:", round(best_top1*100,2),"%")
    print("Best Top-3 Accuracy:", round(best_top3*100,2),"%")


if __name__ == "__main__":
    main()