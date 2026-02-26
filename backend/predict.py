import sys
import json
import tensorflow as tf
import numpy as np
from PIL import Image

# Load model
model = tf.keras.models.load_model('ai_models/plant_disease_efficientnet.h5')

# Load class indices
with open('ai_models/class_indices.json', 'r') as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}

# Get image path from command line
image_path = sys.argv[1]

# Load and preprocess
img = Image.open(image_path).convert('RGB')
img = img.resize((224, 224))
img_array = np.array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# Predict
predictions = model.predict(img_array, verbose=0)
predicted_idx = np.argmax(predictions[0])
confidence = float(predictions[0][predicted_idx])

# Output JSON
result = {
    'disease': idx_to_class[predicted_idx],
    'confidence': confidence,
    'model': 'EfficientNetB0'
}

print(json.dumps(result))
