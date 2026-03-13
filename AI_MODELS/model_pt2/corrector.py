import os
import random
import shutil
from PIL import Image
import numpy as np

# ================= CONFIG =================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SOURCE_DATASET = os.path.join(BASE_DIR, "FINAL_DATASET")
OUTPUT_DATASET = os.path.join(BASE_DIR, "processed_dataset")

TRAIN_DIR = os.path.join(OUTPUT_DATASET, "train")
TEST_DIR = os.path.join(OUTPUT_DATASET, "test")

MAX_IMAGES_PER_CLASS = 7000
TEST_RATIO = 0.2

os.makedirs(TRAIN_DIR, exist_ok=True)
os.makedirs(TEST_DIR, exist_ok=True)

removed_grayscale = 0
removed_corrupt = 0
total_checked = 0

# ================= HELPER =================

def is_fake_grayscale(img):

    arr = np.array(img)

    if len(arr.shape) != 3:
        return True

    r = arr[:,:,0]
    g = arr[:,:,1]
    b = arr[:,:,2]

    return np.array_equal(r,g) and np.array_equal(r,b)


def normalize_class_name(name):

    name = name.replace("__","_")
    name = name.replace(",","")
    name = name.replace("(","")
    name = name.replace(")","")

    return name.strip()


# ================= PROCESS DATASET =================

print("\n===== DATASET CLEANING STARTED =====\n")

for cls in os.listdir(SOURCE_DATASET):

    class_path = os.path.join(SOURCE_DATASET, cls)

    if not os.path.isdir(class_path):
        continue

    normalized_cls = normalize_class_name(cls)

    images = []

    for img_name in os.listdir(class_path):

        img_path = os.path.join(class_path, img_name)

        try:

            img = Image.open(img_path)
            total_checked += 1

            # remove grayscale
            if img.mode != "RGB":
                removed_grayscale += 1
                continue

            # remove fake grayscale
            if is_fake_grayscale(img):
                removed_grayscale += 1
                continue

            images.append(img_path)

        except:
            removed_corrupt += 1

    print(f"{normalized_cls} cleaned images:", len(images))

    # limit very large classes
    if len(images) > MAX_IMAGES_PER_CLASS:
        images = random.sample(images, MAX_IMAGES_PER_CLASS)

    random.shuffle(images)

    split_index = int(len(images) * (1 - TEST_RATIO))

    train_images = images[:split_index]
    test_images = images[split_index:]

    train_class_dir = os.path.join(TRAIN_DIR, normalized_cls)
    test_class_dir = os.path.join(TEST_DIR, normalized_cls)

    os.makedirs(train_class_dir, exist_ok=True)
    os.makedirs(test_class_dir, exist_ok=True)

    for img in train_images:
        shutil.copy(img, train_class_dir)

    for img in test_images:
        shutil.copy(img, test_class_dir)

# ================= FINAL REPORT =================

train_count = 0
test_count = 0
class_count = 0

print("\n===== FINAL DATASET REPORT =====\n")

for cls in os.listdir(TRAIN_DIR):

    train_cls = os.path.join(TRAIN_DIR, cls)
    test_cls = os.path.join(TEST_DIR, cls)

    train_imgs = len(os.listdir(train_cls))
    test_imgs = len(os.listdir(test_cls))

    print(f"{cls}  Train:{train_imgs}  Test:{test_imgs}")

    train_count += train_imgs
    test_count += test_imgs
    class_count += 1

print("\n==============================")
print("Total Classes :", class_count)
print("Train Images  :", train_count)
print("Test Images   :", test_count)
print("Total Images  :", train_count + test_count)
print("Removed Gray  :", removed_grayscale)
print("Removed Corrupt:", removed_corrupt)
print("==============================")