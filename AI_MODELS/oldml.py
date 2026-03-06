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
print("Using device:", DEVICE)

# ================= PATH SETUP =================
# ensure assets load correctly regardless of current working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ================= LOAD CLASS MAP =================
class_map_path = os.path.join(BASE_DIR, 'class_indices.json')
with open(class_map_path, 'r') as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

print("📊 Total classes loaded:", num_classes)

# ================= LOAD MODEL =================
def load_model():
    model = create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)
    model.load_state_dict(torch.load(os.path.join(BASE_DIR, "best_model.pth"), map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

model = load_model()
print("Model loaded successfully")

# ================= TRANSFORMS =================
transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ================= PREDICT =================
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    try:
        file = request.files['image']

        img = Image.open(io.BytesIO(file.read())).convert('RGB')
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

# ================= HEALTH CHECK =================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'device': str(DEVICE),
        'total_classes': num_classes
    })

# ================= RUN =================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)