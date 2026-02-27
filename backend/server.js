const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');
const analysisRoutes = require('./routes/analysis.routes');
const espRoutes = require('./routes/esp_status');
const basicRoutes = require('./routes/basic_routes');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai.routes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static('uploads'));
app.use('/camera', express.static(path.join(__dirname, 'public')));

app.use('/api/analysis', analysisRoutes);
app.use('/api/analysis', espRoutes);
app.use('/api/analysis', basicRoutes);
app.use('/api/analysis', uploadRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'AgroDetect AI Backend',
    status: 'running',
    version: '2.0.0',
    features: ['ML Prediction', 'AI Analysis', 'Database Storage', 'IoT Integration'],
    endpoints: [
      'POST /api/analysis/upload - Web image upload with AI analysis',
      'POST /api/analysis/upload-esp - ESP32 base64 image upload',
      'GET /api/analysis/history - Get scan history',
      'GET /api/analysis/:id - Get single scan',
      'POST /api/analysis/esp-status - ESP heartbeat',
      'POST /api/analysis/esp-enable - Enable ESP device',
      'POST /api/analysis/esp-disable - Disable ESP device',
      'POST /api/ai/analyze - Scenario-aware disease analysis',
      'POST /api/ai/explain - Get disease explanation',
      'POST /api/ai/farmer-advice - Get farmer advice',
      'POST /api/ai/education - Get educational content',
      'GET /api/ai/health - Check AI service health'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`✅ All routes loaded successfully`);
  console.log(`🤖 AI-powered analysis enabled`);
});