from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import io
import json
from timm import create_model

app = Flask(__name__)
CORS(app)

# ================= DEVICE =================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ================= LOAD CLASS MAP =================
with open('class_indices.json', 'r') as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

# ================= MODEL =================
def load_model():
    model = create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)
    model.load_state_dict(torch.load("plant_disease_efficientnet.pt", map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

model = load_model()

# ================= TRANSFORMS =================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# ================= PREDICT =================
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    try:
        file = request.files['image']

        # Load image
        img = Image.open(io.BytesIO(file.read())).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(DEVICE)

        # Inference
        with torch.no_grad():
            outputs = model(img_tensor)
            probs = F.softmax(outputs, dim=1)
            confidence, predicted_class_idx = torch.max(probs, 1)

        disease = idx_to_class[int(predicted_class_idx.item())]

        return jsonify({
            'disease': disease,
            'confidence': float(confidence.item()),
            'model': 'EfficientNetB0-PyTorch'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ================= HEALTH =================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'device': str(DEVICE)
    })


# ================= RUN =================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)