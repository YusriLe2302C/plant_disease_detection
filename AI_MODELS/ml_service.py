from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import io
import json
import numpy as np
import cv2
from timm import create_model
import os
# from yolo_leaf_detector import detect_leaf_yolo
import base64

app = Flask(__name__)
CORS(app)

# ================= DEVICE =================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("🚀 Using device:", DEVICE)

# ================= LOAD CLASS MAP =================
with open('model_pt2/class_indices.json', 'r') as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}
num_classes = len(class_indices)

print("📊 Total classes loaded:", num_classes)

# ================= LOAD MODELS =================
def load_models():
    # Load Top-1 Model
    model_top1 = create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)
    model_top1.load_state_dict(torch.load('model_pt2/best_model_top1.pth', map_location=DEVICE))
    model_top1.to(DEVICE)
    model_top1.eval()
    print("✅ Loaded Top-1 model: best_model_top1.pth")
    
    # Load Top-3 Model
    model_top3 = create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)
    model_top3.load_state_dict(torch.load('model_pt2/best_model_top3.pth', map_location=DEVICE))
    model_top3.to(DEVICE)
    model_top3.eval()
    print("✅ Loaded Top-3 model: best_model_top3.pth")
    
    return model_top1, model_top3

model_top1, model_top3 = load_models()
print("✅ Both models ready")

# # ================= PREPROCESSING =================
def remove_background_and_enhance(image_bgr):
    """Remove background and enhance leaf image"""
    # Convert to RGB
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    # Create mask using GrabCut
    mask = np.zeros(image_bgr.shape[:2], np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    
    h, w = image_bgr.shape[:2]
    rect = (10, 10, w-10, h-10)
    
    cv2.grabCut(image_bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
    
    # Apply mask
    result = image_bgr * mask2[:, :, np.newaxis]
    
    # Replace background with white
    result[mask2 == 0] = [255, 255, 255]
    
    # Enhance sharpness
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(result, -1, kernel)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoisingColored(sharpened, None, 10, 10, 7, 21)
    
    # Enhance contrast
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    return enhanced

# ================= TRANSFORMS =================
transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
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

        np_img = np.frombuffer(file_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        if image_bgr is None:
            return jsonify({'error': 'Invalid image format'}), 400

        # Convert to PIL
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(image_rgb)
        img_tensor = transform(img_pil).unsqueeze(0).to(DEVICE)

        # Get Top-1 Prediction
        with torch.no_grad():
            outputs_top1 = model_top1(img_tensor)
            probs_top1 = F.softmax(outputs_top1, dim=1)
            confidence_top1, predicted_class_idx_top1 = torch.max(probs_top1, 1)

        # Get Top-3 Predictions
        with torch.no_grad():
            outputs_top3 = model_top3(img_tensor)
            probs_top3 = F.softmax(outputs_top3, dim=1)
            top3_probs, top3_indices = torch.topk(probs_top3, 3, dim=1)

        # Primary disease (Top-1)
        disease = idx_to_class[int(predicted_class_idx_top1.item())]
        
        # Top-3 predictions
        top3_predictions = []
        for i in range(3):
            class_idx = int(top3_indices[0][i].item())
            prob = float(top3_probs[0][i].item())
            class_name = idx_to_class[class_idx]
            top3_predictions.append({
                'disease': class_name,
                'confidence': round(prob, 4)
            })
        
        # Encode original image
        _, buffer = cv2.imencode('.jpg', image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 100])
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')

        return jsonify({
            'disease': disease,
            'confidence': round(float(confidence_top1.item()), 4),
            'top3_predictions': top3_predictions,
            'model': 'EfficientNetB0-PyTorch-Dual',
            'device': str(DEVICE),
            'annotated_image': annotated_base64
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
        
        np_img = np.frombuffer(img_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        if image_bgr is None:
            return jsonify({'error': 'invalid image'}), 400
        
        # Convert to PIL
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(image_rgb)
        img_tensor = transform(img_pil).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(img_tensor)
            probs = F.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, 1)

        disease = idx_to_class[pred.item()]

        return jsonify({
            'status': 'received',
            'disease': disease,
            'confidence': round(float(conf.item()), 4),
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