import cv2
import numpy as np
from ultralytics import YOLO
import torch


class YOLOLeafDetector:
    def __init__(self, model_path='best.pt'):
        """Initialize YOLO model for leaf detection"""
        self.model = YOLO(model_path)
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"✅ YOLO Leaf Detector loaded on {self.device}")
    
    def detect_and_crop(self, image_bgr):
        """
        Detect leaf in image and return cropped/annotated version
        
        Returns:
            tuple: (annotated_image, cropped_leaf, is_valid, confidence)
        """
        # Run YOLO detection
        results = self.model(image_bgr, verbose=False)
        
        if len(results) == 0 or len(results[0].boxes) == 0:
            return None, None, False, 0.0
        
        # Get best detection
        boxes = results[0].boxes
        confidences = boxes.conf.cpu().numpy()
        best_idx = np.argmax(confidences)
        best_conf = float(confidences[best_idx])
        
        # Get bounding box
        box = boxes.xyxy[best_idx].cpu().numpy().astype(int)
        x1, y1, x2, y2 = box
        
        # Create annotated image
        annotated = image_bgr.copy()
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(annotated, f'Leaf: {best_conf:.2f}', (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Crop leaf region
        cropped = image_bgr[y1:y2, x1:x2]
        
        # Validate detection
        is_valid = best_conf > 0.3 and cropped.size > 0
        
        return annotated, cropped, is_valid, best_conf


# Global instance
_yolo_detector = None

def get_yolo_detector():
    """Get or create YOLO detector instance"""
    global _yolo_detector
    if _yolo_detector is None:
        _yolo_detector = YOLOLeafDetector()
    return _yolo_detector


def detect_leaf_yolo(image_bgr):
    """
    Detect leaf using YOLO and return processed images
    
    Returns:
        dict: {
            'is_valid': bool,
            'confidence': float,
            'annotated_image': np.array,
            'cropped_leaf': np.array,
            'message': str
        }
    """
    try:
        detector = get_yolo_detector()
        annotated, cropped, is_valid, confidence = detector.detect_and_crop(image_bgr)
        
        if not is_valid:
            return {
                'is_valid': False,
                'confidence': confidence,
                'annotated_image': None,
                'cropped_leaf': None,
                'message': f'No leaf detected (confidence: {confidence:.2f})'
            }
        
        return {
            'is_valid': True,
            'confidence': confidence,
            'annotated_image': annotated,
            'cropped_leaf': cropped,
            'message': f'Leaf detected with {confidence:.2%} confidence'
        }
    
    except Exception as e:
        return {
            'is_valid': False,
            'confidence': 0.0,
            'annotated_image': None,
            'cropped_leaf': None,
            'message': f'Detection failed: {str(e)}'
        }
