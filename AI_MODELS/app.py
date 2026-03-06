from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import numpy as np
import cv2
import io
import json
from ultralytics import YOLO
from timm import create_model
import os

# base directory for relative file paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)

# ================= DEVICE =================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", DEVICE)

# ================= LOAD CLASS MAP =================
with open(os.path.join(BASE_DIR, "class_indices.json")) as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

# ================= LOAD YOLO MODEL =================
leaf_detector = YOLO(os.path.join(BASE_DIR, "leaf_detector.pt"))

# ================= LOAD EFFICIENTNET =================
def load_classifier():
    model = create_model("efficientnet_b0", pretrained=False, num_classes=num_classes)
    model.load_state_dict(torch.load(os.path.join(BASE_DIR, "best_model.pth"), map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

classifier = load_classifier()

# ================= IMAGE TRANSFORM =================
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485,0.456,0.406],
        std=[0.229,0.224,0.225]
    )
])

# ================= LEAF DETECTION =================
def detect_leaf(image):

    results = leaf_detector(image)

    boxes = results[0].boxes

    if boxes is None or len(boxes) == 0:
        return None

    box = boxes.xyxy[0].cpu().numpy()
    x1,y1,x2,y2 = map(int, box)

    leaf = image.crop((x1,y1,x2,y2))

    return leaf


# ================= LEAF SEGMENTATION =================
def segment_leaf(leaf):

    leaf_np = np.array(leaf)

    hsv = cv2.cvtColor(leaf_np, cv2.COLOR_RGB2HSV)

    lower = np.array([25,40,40])
    upper = np.array([85,255,255])

    mask = cv2.inRange(hsv, lower, upper)

    segmented = cv2.bitwise_and(leaf_np, leaf_np, mask=mask)

    return segmented, mask


# ================= BACKGROUND NORMALIZATION =================
def create_lab_style_image(segmented, mask):

    h,w,_ = segmented.shape

    background = np.ones((h,w,3), dtype=np.uint8) * 255

    background[mask > 0] = segmented[mask > 0]

    return background


# ================= CLASSIFICATION =================
def classify_leaf(image):

    img = Image.fromarray(image)

    tensor = transform(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():

        outputs = classifier(tensor)

        probs = F.softmax(outputs, dim=1)

        conf, idx = torch.max(probs,1)

    disease = idx_to_class[int(idx.item())]

    return disease, float(conf.item())


# ================= REPORT =================
def generate_report(disease, confidence):

    return {
        "disease": disease,
        "confidence_percent": round(confidence*100,2)
    }


# ================= MAIN PIPELINE =================
@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({"error":"no image provided"}), 400

    file = request.files["image"]

    # ensure we received something resembling an image
    data = file.read()
    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        # PIL throws UnidentifiedImageError for invalid files
        return jsonify({"error": "invalid image file", "message": str(e)}), 400

    # Step 1: Detect leaf
    leaf = detect_leaf(image)

    if leaf is None:
        return jsonify({"error":"no leaf detected"})

    # Step 2: Segment leaf
    segmented, mask = segment_leaf(leaf)

    # Step 3: Convert to lab-style image
    lab_leaf = create_lab_style_image(segmented, mask)

    # Step 4: Classify disease
    disease, confidence = classify_leaf(lab_leaf)

    # Step 5: Generate report
    report = generate_report(disease, confidence)

    return jsonify({
        "pipeline":[
            "YOLO leaf detection",
            "Leaf segmentation",
            "Background normalization",
            "EfficientNet classification"
        ],
        "result": report
    })


# ================= HEALTH CHECK =================
@app.route("/health")
def health():

    return jsonify({
        "status":"running",
        "device":str(DEVICE),
        "classes":num_classes
    })


# ================= RUN =================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)