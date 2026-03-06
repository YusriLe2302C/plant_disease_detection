"""
Test API to verify ML pipeline flow
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from yolo_leaf_detector import detect_leaf_yolo
import base64

app = Flask(__name__)
CORS(app)

def remove_background_and_enhance(image_bgr):
    """Remove background and enhance leaf image"""
    mask = np.zeros(image_bgr.shape[:2], np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    
    h, w = image_bgr.shape[:2]
    rect = (10, 10, w-10, h-10)
    
    cv2.grabCut(image_bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
    
    result = image_bgr * mask2[:, :, np.newaxis]
    result[mask2 == 0] = [255, 255, 255]
    
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(result, -1, kernel)
    
    denoised = cv2.fastNlMeansDenoisingColored(sharpened, None, 10, 10, 7, 21)
    
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    return enhanced

@app.route('/test-pipeline', methods=['POST'])
def test_pipeline():
    """Test the complete ML pipeline flow"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        file_bytes = request.files['image'].read()
        np_img = np.frombuffer(file_bytes, np.uint8)
        original = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        pipeline_steps = []
        
        # Step 1: YOLO Detection
        yolo_result = detect_leaf_yolo(original)
        pipeline_steps.append({
            'step': 1,
            'name': 'YOLO Leaf Detection',
            'status': 'success' if yolo_result['is_valid'] else 'failed',
            'confidence': round(yolo_result['confidence'], 4)
        })
        
        if not yolo_result['is_valid']:
            return jsonify({
                'pipeline': pipeline_steps,
                'error': 'YOLO detection failed'
            }), 400
        
        cropped = yolo_result['cropped_leaf']
        
        # Step 2: Background Removal
        enhanced = remove_background_and_enhance(cropped)
        pipeline_steps.append({
            'step': 2,
            'name': 'Background Removal + Enhancement',
            'status': 'success',
            'details': 'GrabCut + Sharpening + Denoising + CLAHE'
        })
        
        # Step 3: Ready for EfficientNet
        pipeline_steps.append({
            'step': 3,
            'name': 'Ready for EfficientNet',
            'status': 'ready',
            'image_size': f"{enhanced.shape[1]}x{enhanced.shape[0]}"
        })
        
        # Encode images
        _, orig_buf = cv2.imencode('.jpg', original)
        _, crop_buf = cv2.imencode('.jpg', cropped)
        _, enh_buf = cv2.imencode('.jpg', enhanced)
        
        return jsonify({
            'success': True,
            'pipeline': pipeline_steps,
            'images': {
                'original': base64.b64encode(orig_buf).decode('utf-8'),
                'yolo_cropped': base64.b64encode(crop_buf).decode('utf-8'),
                'background_removed': base64.b64encode(enh_buf).decode('utf-8')
            },
            'message': 'Pipeline: YOLO → Remove BG → EfficientNet ✅'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
