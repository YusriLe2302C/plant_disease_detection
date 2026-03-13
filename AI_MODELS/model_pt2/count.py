import os

# Get absolute path of current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Relative dataset folder inside project
DATASET_RELATIVE = "processed_dataset/test"  # Change to "FINAL_DATASE/train" if needed

# Build absolute dataset path
DATASET_PATH = os.path.join(BASE_DIR, DATASET_RELATIVE)

print("Relative Path :", DATASET_RELATIVE)
print("Absolute Path :", DATASET_PATH)

image_ext = (".jpg", ".jpeg", ".png", ".bmp")

total_images = 0
class_count = 0

print("\n===== PLANT DATASET REPORT =====\n")

for class_name in os.listdir(DATASET_PATH):

    class_path = os.path.join(DATASET_PATH, class_name)

    if os.path.isdir(class_path):

        images = [
            f for f in os.listdir(class_path)
            if f.lower().endswith(image_ext)
        ]

        count = len(images)

        print(f"{class_name} : {count}")

        total_images += count
        class_count += 1


print("\n------------------------------")
print("Total Classes :", class_count)
print("Total Images  :", total_images)
print("------------------------------")