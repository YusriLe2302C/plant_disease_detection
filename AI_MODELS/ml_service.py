from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import io
import json
from timm import create_model
import os

app = Flask(__name__)
CORS(app)

# ================= DEVICE =================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("🚀 Using device:", DEVICE)

# ================= LOAD CLASS MAP =================
with open('class_indices.json', 'r') as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

print("📊 Total classes loaded:", num_classes)

# ================= LOAD MODEL =================
def load_model():
    model = create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)

    model_files = [
        "best_model.pth",
        "final_model.pth",
        "plant_disease_efficientnet.pt",
        "best_model.pt"
    ]

    loaded = False
    for mf in model_files:
        if os.path.exists(mf):
            try:
                model.load_state_dict(torch.load(mf, map_location=DEVICE))
                print(f"✅ Loaded model: {mf}")
                loaded = True
                break
            except Exception as e:
                print(f"⚠️ Failed loading {mf}: {e}")

    if not loaded:
        raise RuntimeError("❌ No valid model file found!")

    model.to(DEVICE)
    model.eval()
    return model

model = load_model()
print("✅ Model ready")

# ================= TRANSFORMS =================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),

])


# =========================================================
# 🔥 MAIN PREDICT ENDPOINT
# =========================================================
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    try:
        file = request.files['image']
        file_bytes = file.read()

        # ---- classification ----
        img = Image.open(io.BytesIO(file_bytes)).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(img_tensor)
            probs = F.softmax(outputs, dim=1)
            confidence, predicted_class_idx = torch.max(probs, 1)

        disease = idx_to_class[int(predicted_class_idx.item())]

        return jsonify({
            'disease': disease,
            'confidence': round(float(confidence.item()), 4),
            'model': 'EfficientNetB0-PyTorch',
            'device': str(DEVICE)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================================================
# 📱 CAMERA UPLOAD (ESP-LIKE PHONE MODE)
# =========================================================
@app.route('/camera/upload', methods=['POST'])
def camera_upload():
    if 'image' not in request.files:
        return jsonify({'error': 'no image'}), 400

    try:
        img_bytes = request.files['image'].read()

        # ---- classification ----
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(img_tensor)
            probs = F.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, 1)

        disease = idx_to_class[pred.item()]
        confidence = float(conf.item())

        return jsonify({
            'status': 'received',
            'disease': disease,
            'confidence': round(confidence, 4),
            'device': str(DEVICE)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================================================
# ❤️ HEALTH
# =========================================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'device': str(DEVICE),
        'total_classes': num_classes
    })


# =========================================================
# 🚀 RUN
# =========================================================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)