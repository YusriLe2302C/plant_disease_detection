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
import base64
import os

# ================= BASE DIRECTORY =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)

# ================= DEVICE =================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", DEVICE)

# ================= LOAD CLASS MAP =================
with open(os.path.join(BASE_DIR, "model_pt2", "class_indices.json")) as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

print("Total classes:", num_classes)

# ================= LOAD YOLO MODEL =================
leaf_detector = YOLO(os.path.join(BASE_DIR, "leaf_detector.pt"))

# ================= LOAD EFFICIENTNET MODELS =================
def load_models():
    # Top-1 Model
    model_top1 = create_model(
        "efficientnet_b0",
        pretrained=False,
        num_classes=num_classes
    )
    model_top1.load_state_dict(
        torch.load(
            os.path.join(BASE_DIR, "model_pt2", "best_model_top1.pth"),
            map_location=DEVICE
        )
    )
    model_top1.to(DEVICE)
    model_top1.eval()

    # Top-3 Model
    model_top3 = create_model(
        "efficientnet_b0",
        pretrained=False,
        num_classes=num_classes
    )
    model_top3.load_state_dict(
        torch.load(
            os.path.join(BASE_DIR, "model_pt2", "best_model_top3.pth"),
            map_location=DEVICE
        )
    )
    model_top3.to(DEVICE)
    model_top3.eval()

    return model_top1, model_top3

model_top1, model_top3 = load_models()

print("Models loaded successfully")

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

    results = leaf_detector(np.array(image))

    boxes = results[0].boxes

    if boxes is None or len(boxes) == 0:
        return None

    boxes_xyxy = boxes.xyxy.detach().cpu().numpy()

    areas = (boxes_xyxy[:,2]-boxes_xyxy[:,0]) * (boxes_xyxy[:,3]-boxes_xyxy[:,1])
    largest_idx = np.argmax(areas)

    box = boxes_xyxy[largest_idx]

    x1,y1,x2,y2 = map(int, box)

    leaf = image.crop((x1,y1,x2,y2))

    return leaf


# ================= LEAF SEGMENTATION =================
def segment_leaf(leaf):

    leaf_np = np.array(leaf)

    h, w, _ = leaf_np.shape

    mask = np.zeros((h, w), np.uint8)

    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    # rectangle slightly inside the image
    rect = (5, 5, w-10, h-10)

    cv2.grabCut(
        leaf_np,
        mask,
        rect,
        bgdModel,
        fgdModel,
        5,
        cv2.GC_INIT_WITH_RECT
    )

    mask2 = np.where(
        (mask == 2) | (mask == 0),
        0,
        1
    ).astype("uint8")

    segmented = leaf_np * mask2[:, :, np.newaxis]

    return segmented, mask2 * 255


# ================= BACKGROUND NORMALIZATION =================
def create_lab_style_image(segmented, mask):

    h,w,_ = segmented.shape

    background = np.ones((h,w,3), dtype=np.uint8) * 255

    background[mask > 0] = segmented[mask > 0]

    return background


# ================= CLASSIFICATION =================
def classify_leaf(image):
    img = Image.fromarray(image.astype("uint8"))
    tensor = transform(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        # Top-1 Model Predictions
        outputs_top1 = model_top1(tensor)
        probs_top1 = F.softmax(outputs_top1, dim=1)
        top1_pred = torch.topk(probs_top1, 3)
        top1_indices = top1_pred.indices[0].cpu().numpy()
        top1_scores = top1_pred.values[0].cpu().numpy()

        # Top-3 Model Predictions
        outputs_top3 = model_top3(tensor)
        probs_top3 = F.softmax(outputs_top3, dim=1)
        top3_pred = torch.topk(probs_top3, 3)
        top3_indices = top3_pred.indices[0].cpu().numpy()
        top3_scores = top3_pred.values[0].cpu().numpy()

        # Combined Model (average probabilities)
        combined_probs = (probs_top1 + probs_top3) / 2
        combined_pred = torch.topk(combined_probs, 3)
        combined_indices = combined_pred.indices[0].cpu().numpy()
        combined_scores = combined_pred.values[0].cpu().numpy()

    # Format all predictions
    top1_predictions = []
    for i in range(3):
        top1_predictions.append({
            "class": idx_to_class[int(top1_indices[i])],
            "confidence_percent": round(float(top1_scores[i]) * 100, 2)
        })

    top3_predictions = []
    for i in range(3):
        top3_predictions.append({
            "class": idx_to_class[int(top3_indices[i])],
            "confidence_percent": round(float(top3_scores[i]) * 100, 2)
        })

    combined_predictions = []
    for i in range(3):
        combined_predictions.append({
            "class": idx_to_class[int(combined_indices[i])],
            "confidence_percent": round(float(combined_scores[i]) * 100, 2)
        })

    return {
        "top3_predictions": top3_predictions
    }


# ================= MAIN PIPELINE =================
@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({"error":"no image provided"}), 400

    file = request.files["image"]

    data = file.read()

    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        return jsonify({
            "error":"invalid image file",
            "message":str(e)
        }),400

    # Step 1 → Detect leaf
    leaf = detect_leaf(image)

    if leaf is None:
        return jsonify({"error":"no leaf detected"}),400

    # Step 2 → Segment leaf
    segmented, mask = segment_leaf(leaf)

    # Step 3 → Normalize background
    lab_leaf = create_lab_style_image(segmented, mask)

    # Step 4 → Classify disease
    results = classify_leaf(lab_leaf)

    # Encode processed image
    processed_pil = Image.fromarray(lab_leaf.astype('uint8'))
    buffer = io.BytesIO()
    processed_pil.save(buffer, format='JPEG', quality=95)
    processed_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return jsonify({
        "disease": results["top3_predictions"][0]["class"],
        "confidence": round(results["top3_predictions"][0]["confidence_percent"] / 100, 4),
        "model": "EfficientNetB0-PyTorch (Top3 Model)",
        "device": str(DEVICE),
        "processed_image": processed_base64,
        "pipeline": [
            "YOLO leaf detection",
            "Leaf segmentation", 
            "Background normalization",
            "EfficientNet top3 classification"
        ],
        "top3_predictions": results["top3_predictions"]
    })


# ================= HEALTH CHECK =================
@app.route("/health")
def health():

    return jsonify({
        "status":"running",
        "device":str(DEVICE),
        "total_classes":num_classes
    })


# ================= RUN =================
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False
    )