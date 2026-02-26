const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

/* =====================================================
   POST /api/ai/analyze
   Scenario-aware disease analysis
===================================================== */
router.post('/analyze', aiController.analyzeDisease);

/* =====================================================
   POST /api/ai/explain
   Get disease explanation
===================================================== */
router.post('/explain', aiController.explainDisease);

/* =====================================================
   POST /api/ai/farmer-advice
   Get farmer-friendly advice
===================================================== */
router.post('/farmer-advice', aiController.getFarmerAdvice);

/* =====================================================
   POST /api/ai/education
   Get educational explanation
===================================================== */
router.post('/education', aiController.getEducationalExplanation);

/* =====================================================
   GET /api/ai/health
   Check Ollama service health
===================================================== */
router.get('/health', aiController.checkHealth);

/* =====================================================
   POST /api/ai/chat
   Scenario-aware chatbot
===================================================== */
router.post('/chat', aiController.chat);

module.exports = router;
