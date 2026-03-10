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
with open(os.path.join(BASE_DIR, "class_indices.json")) as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

print("Total classes:", num_classes)

# ================= LOAD YOLO MODEL =================
leaf_detector = YOLO(os.path.join(BASE_DIR, "leaf_detector.pt"))

# ================= LOAD EFFICIENTNET =================
def load_classifier():

    model = create_model(
        "efficientnet_b0",
        pretrained=False,
        num_classes=num_classes
    )

    model.load_state_dict(
        torch.load(
            os.path.join(BASE_DIR, "best_model.pth"),
            map_location=DEVICE
        )
    )

    model.to(DEVICE)
    model.eval()

    return model

classifier = load_classifier()

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

        outputs = classifier(tensor)

        probs = F.softmax(outputs, dim=1)

        # TOP 3 predictions
        top3 = torch.topk(probs, 3)

        indices = top3.indices[0].cpu().numpy()
        scores = top3.values[0].cpu().numpy()

    top_predictions = []

    for i in range(3):

        top_predictions.append({
            "class": idx_to_class[int(indices[i])],
            "confidence_percent": round(float(scores[i]) * 100, 2)
        })

    best_class = idx_to_class[int(indices[0])]
    best_conf = float(scores[0])

    return best_class, best_conf, top_predictions


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
    disease, confidence, top_predictions = classify_leaf(lab_leaf)

    # Encode processed image
    processed_pil = Image.fromarray(lab_leaf.astype('uint8'))
    buffer = io.BytesIO()
    processed_pil.save(buffer, format='JPEG', quality=95)
    processed_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return jsonify({
        "disease": disease,
        "confidence": round(confidence, 4),
        "model": "EfficientNetB0-PyTorch",
        "device": str(DEVICE),
        "processed_image": processed_base64,
        "pipeline": [
            "YOLO leaf detection",
            "Leaf segmentation", 
            "Background normalization",
            "EfficientNet classification"
        ],
        "top3_predictions": top_predictions
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