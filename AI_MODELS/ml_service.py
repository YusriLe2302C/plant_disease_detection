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
from yolo_leaf_detector import detect_leaf_yolo
import base64

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
    model.load_state_dict(torch.load('best_model.pth', map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    print("✅ Loaded model: best_model.pth")
    return model

model = load_model()
print("✅ Model ready")

# ================= PREPROCESSING =================
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

        # YOLO leaf detection
        yolo_result = detect_leaf_yolo(image_bgr)
        
        if not yolo_result['is_valid']:
            return jsonify({
                'error': 'No plant leaf detected in image',
                'message': yolo_result['message'],
                'confidence': yolo_result['confidence'],
                'suggestion': 'Please upload a clear image of a plant leaf'
            }), 400

        # Use cropped leaf for classification
        cropped_leaf = yolo_result['cropped_leaf']
        annotated_img = yolo_result['annotated_image']
        
        # Remove background and enhance
        enhanced_leaf = remove_background_and_enhance(cropped_leaf)
        
        # Convert to PIL
        enhanced_rgb = cv2.cvtColor(enhanced_leaf, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(enhanced_rgb)
        img_tensor = transform(img_pil).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(img_tensor)
            probs = F.softmax(outputs, dim=1)
            confidence, predicted_class_idx = torch.max(probs, 1)

        disease = idx_to_class[int(predicted_class_idx.item())]
        
        # Encode annotated image at maximum quality
        _, buffer = cv2.imencode('.jpg', annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 100])
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')

        return jsonify({
            'disease': disease,
            'confidence': round(float(confidence.item()), 4),
            'model': 'EfficientNetB0-PyTorch',
            'device': str(DEVICE),
            'yolo_confidence': round(yolo_result['confidence'], 4),
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
        
        # YOLO detection
        yolo_result = detect_leaf_yolo(image_bgr)
        
        if not yolo_result['is_valid']:
            return jsonify({
                'error': 'No leaf detected',
                'message': yolo_result['message']
            }), 400

        # Use cropped leaf
        cropped_leaf = yolo_result['cropped_leaf']
        
        # Remove background and enhance
        enhanced_leaf = remove_background_and_enhance(cropped_leaf)
        
        cropped_rgb = cv2.cvtColor(enhanced_leaf, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(cropped_rgb)
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