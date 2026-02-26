const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runPrediction } = require('../ml_predictor');
const ollamaService = require('../services/ollama.service');
const Scan = require('../models/scan.model');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/plant_images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imagePath = req.file.path;
    const startTime = Date.now();
    const scenario = req.body.scenario || 'farm_monitoring';

    const prediction = await runPrediction(imagePath);
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    let aiAnalysis = null;
    try {
      aiAnalysis = await ollamaService.analyzeDisease(
        prediction.disease,
        prediction.confidence,
        scenario
      );
      
      // Sanitize actions and prevention to ensure they are string arrays
      if (aiAnalysis.actions && Array.isArray(aiAnalysis.actions)) {
        aiAnalysis.actions = aiAnalysis.actions.map(action => 
          typeof action === 'string' ? action : JSON.stringify(action)
        );
      }
      if (aiAnalysis.prevention && Array.isArray(aiAnalysis.prevention)) {
        aiAnalysis.prevention = aiAnalysis.prevention.map(prev => 
          typeof prev === 'string' ? prev : JSON.stringify(prev)
        );
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      aiAnalysis = ollamaService.getFallbackResponse(
        prediction.disease,
        prediction.confidence,
        scenario
      );
    }

    const scanData = {
      disease: prediction.disease,
      confidence: prediction.confidence,
      severity: aiAnalysis.severity,
      scenario: scenario,
      image_url: `/${imagePath}`,
      ai_analysis: {
        summary: aiAnalysis.summary,
        actions: aiAnalysis.actions,
        prevention: aiAnalysis.prevention
      },
      model_used: prediction.model || 'EfficientNetB0',
      processing_time: parseFloat(processingTime),
      timestamp: new Date()
    };

    let savedScan = null;
    try {
      savedScan = await Scan.create(scanData);
    } catch (dbError) {
      console.error('Database save failed:', dbError);
    }

    return res.json({
      success: true,
      message: 'Analysis complete',
      disease: prediction.disease,
      confidence: prediction.confidence,
      model: prediction.model,
      processing_time: processingTime,
      image_url: `/${imagePath}`,
      ai_analysis: aiAnalysis,
      scan_id: savedScan?._id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

module.exports = router;
