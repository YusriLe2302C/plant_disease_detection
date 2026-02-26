const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  disease: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  severity: {
    type: String,
    enum: ['High', 'Moderate', 'Uncertain'],
    required: true
  },
  scenario: {
    type: String,
    enum: ['farm_monitoring', 'home_gardener', 'agricultural_training'],
    default: 'farm_monitoring'
  },
  image_url: {
    type: String
  },
  ai_analysis: {
    summary: String,
    actions: [String],
    prevention: [String]
  },
  model_used: {
    type: String,
    default: 'EfficientNetB0'
  },
  processing_time: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scan', scanSchema);
