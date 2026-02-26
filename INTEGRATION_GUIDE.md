# AgroDetect AI - Complete Integration Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- MongoDB (v5+)
- Ollama (optional, for AI features)

### Installation Steps

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Edit with your settings
node verify_db.js     # Verify database connection
```

#### 2. ML Service Setup
```bash
cd AI_MODELS
pip install flask flask-cors torch torchvision pillow
python ml_service.py  # Runs on port 5001
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on port 5173
```

#### 4. Start Backend Server
```bash
cd backend
npm start  # Runs on port 5000
```

## 🧪 Testing Integration

### Run Integration Tests
```bash
cd backend
node test_integration.js
```

### Manual Testing

#### Test ML Service
```bash
curl http://localhost:5001/health
```

#### Test Backend
```bash
curl http://localhost:5000/
```

#### Test Database
```bash
cd backend
node verify_db.js
```

#### Test Ollama (Optional)
```bash
curl http://localhost:11434/api/tags
```

## 📊 System Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│   MongoDB   │
│  (React)    │      │  (Node.js)  │      │             │
│  Port 5173  │      │  Port 5000  │      │  Port 27017 │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ├─────▶ ML Service (Python)
                            │       Port 5001
                            │
                            └─────▶ Ollama AI (Optional)
                                    Port 11434
```

## 🔗 API Endpoints

### Analysis Endpoints
- `POST /api/analysis/upload` - Upload image for analysis
- `GET /api/analysis/history` - Get scan history
- `GET /api/analysis/:id` - Get specific scan
- `POST /api/analysis/upload-esp` - ESP32 image upload

### AI Endpoints
- `POST /api/ai/analyze` - AI disease analysis
- `POST /api/ai/chat` - Chatbot interaction
- `GET /api/ai/health` - Check AI service status

### ESP Endpoints
- `POST /api/analysis/esp-status` - ESP heartbeat
- `POST /api/analysis/esp-enable` - Enable ESP device
- `POST /api/analysis/esp-disable` - Disable ESP device

## 🗄️ Database Schema

### Scan Model
```javascript
{
  disease: String,
  confidence: Number (0-1),
  severity: String (High/Moderate/Uncertain),
  scenario: String (farm_monitoring/home_gardener/agricultural_training),
  image_url: String,
  ai_analysis: {
    summary: String,
    actions: [String],
    prevention: [String]
  },
  model_used: String,
  processing_time: Number,
  timestamp: Date
}
```

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Or use MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### ML Service Not Starting
```bash
# Check Python dependencies
pip install -r requirements.txt

# Verify model files exist
ls AI_MODELS/best_model.pt
ls AI_MODELS/class_indices.json
```

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # macOS/Linux

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # macOS/Linux
```

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plantcare_ai
ML_SERVICE_URL=http://localhost:5001
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## ✅ Verification Checklist

- [ ] MongoDB running and accessible
- [ ] Backend dependencies installed
- [ ] ML Service running on port 5001
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Database connection successful
- [ ] ML model files present
- [ ] Upload directory created
- [ ] All API endpoints responding

## 🎯 Testing Workflow

1. **Start MongoDB**
2. **Run Database Verification**: `node verify_db.js`
3. **Start ML Service**: `python ml_service.py`
4. **Start Backend**: `npm start`
5. **Run Integration Tests**: `node test_integration.js`
6. **Start Frontend**: `npm run dev`
7. **Test Upload**: Upload an image through the UI

## 📞 Support

For issues:
1. Check logs in terminal
2. Run `node test_integration.js`
3. Verify all services are running
4. Check .env configuration
