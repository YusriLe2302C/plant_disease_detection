# 🌿 AgroDetect AI - Plant Disease Detection System

Advanced AI-powered plant disease detection system combining deep learning, IoT integration, and intelligent analysis for precision agriculture.

![Version](https://img.shields.io/badge/version-2.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![Node](https://img.shields.io/badge/node-16+-green)

## 🚀 Features

### Core Capabilities
- **AI-Powered Detection**: EfficientNetB0 deep learning model with 95%+ accuracy
- **Real-time Analysis**: Sub-3 second disease diagnosis
- **IoT Integration**: ESP32-CAM automated field monitoring
- **Intelligent Recommendations**: AI-generated treatment plans with chemical specifications
- **Multi-Scenario Support**: Farm monitoring, home gardening, and agricultural training modes
- **Interactive Chatbot**: Two-way conversation with Ollama AI for agricultural guidance
- **Comprehensive Reports**: Downloadable analysis reports with detailed recommendations

### Technical Features
- RESTful API architecture
- MongoDB database for scan history
- Real-time image processing
- Scenario-aware AI responses
- Chemical treatment recommendations with application rates
- Historical data analytics
- Responsive web interface

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│   Backend       │─────▶│   MongoDB       │
│   React + Vite  │      │   Node.js       │      │   Database      │
│   Port 5173     │      │   Port 5000     │      │   Port 27017    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                │
                                ├─────▶ ML Service (Flask + PyTorch)
                                │       Port 5001
                                │
                                └─────▶ Ollama AI (LLaMA 3)
                                        Port 11434
```

## 📦 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **MongoDB** (v5 or higher)
- **Git**

### Optional
- **Ollama** (for AI chatbot features)
- **CUDA** (for GPU acceleration)

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/agrodetect-ai.git
cd agrodetect-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. ML Service Setup
```bash
cd AI_MODELS
pip install flask flask-cors torch torchvision pillow timm
```

### 5. Database Setup
```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Or use MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb-community
```

### 6. Ollama Setup (Optional)
```bash
# Install Ollama from https://ollama.ai
ollama pull llama3
ollama serve
```

## ⚙️ Configuration

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/plantcare_ai
ML_SERVICE_URL=http://localhost:5001
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
MAX_FILE_SIZE=50mb
UPLOAD_DIR=uploads/plant_images
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Start All Services

#### 1. Start MongoDB
```bash
mongod --dbpath /path/to/data
```

#### 2. Start ML Service
```bash
cd AI_MODELS
python ml_service.py
```

#### 3. Start Backend
```bash
cd backend
npm start
```

#### 4. Start Frontend
```bash
cd frontend
npm run dev
```

#### 5. Start Ollama (Optional)
```bash
ollama serve
```

### Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:5001

## 📚 API Documentation

### Analysis Endpoints

#### Upload Image
```http
POST /api/analysis/upload
Content-Type: multipart/form-data

Body:
- image: File
- scenario: String (farm_monitoring|home_gardener|agricultural_training)

Response:
{
  "success": true,
  "disease": "Tomato Early Blight",
  "confidence": 0.92,
  "model": "EfficientNetB0-PyTorch",
  "processing_time": "2.3",
  "image_url": "/uploads/plant_images/...",
  "ai_analysis": {
    "summary": "...",
    "actions": [...],
    "prevention": [...]
  },
  "scan_id": "..."
}
```

#### Get History
```http
GET /api/analysis/history?page=1&limit=10

Response:
{
  "success": true,
  "scans": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

#### Delete Scan
```http
DELETE /api/analysis/:id

Response:
{
  "success": true,
  "message": "Scan deleted successfully"
}
```

### AI Endpoints

#### Chat with AI
```http
POST /api/ai/chat
Content-Type: application/json

Body:
{
  "message": "How do I treat early blight?",
  "scenario": "farm_monitoring"
}

Response:
{
  "success": true,
  "data": {
    "response": "...",
    "scenario": "farm_monitoring"
  }
}
```

#### Check AI Health
```http
GET /api/ai/health

Response:
{
  "success": true,
  "data": {
    "status": "online",
    "models": [...]
  }
}
```

### ESP32 Endpoints

#### ESP Status
```http
POST /api/analysis/esp-status
Content-Type: application/json

Body:
{
  "device_id": "ESP32_001",
  "ip": "192.168.1.100",
  "free_heap": 50000
}
```

#### Upload ESP Image
```http
POST /api/analysis/upload-esp
Content-Type: application/json

Body:
{
  "image_base64": "data:image/jpeg;base64,...",
  "crop": "tomato",
  "efficientnet_output": {...}
}
```

## 📁 Project Structure

```
PLANT_DISEASE/
├── AI_MODELS/
│   ├── best_model.pt
│   ├── plant_disease_efficientnet.pt
│   ├── class_indices.json
│   ├── ml_service.py
│   └── efficient_net.py
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── ai.controller.js
│   ├── models/
│   │   └── scan.model.js
│   ├── routes/
│   │   ├── ai.routes.js
│   │   ├── analysis.routes.js
│   │   ├── basic_routes.js
│   │   ├── esp_status.js
│   │   └── upload.js
│   ├── services/
│   │   └── ollama.service.js
│   ├── ml_predictor.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnimatedBackground.jsx
│   │   │   ├── ChatbotIcon.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Loading.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── ResultPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   └── EspMonitorPage.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
└── README.md
```

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Anime.js** - Animations
- **Axios** - HTTP client
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Multer** - File upload
- **Axios** - HTTP client

### ML Service
- **Python 3.8+** - Language
- **Flask** - Web framework
- **PyTorch** - Deep learning
- **torchvision** - Image processing
- **timm** - Model library
- **Pillow** - Image handling

### AI Service
- **Ollama** - LLM runtime
- **LLaMA 3** - Language model

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb-community
```

### ML Service Not Starting
```bash
# Install dependencies
pip install flask flask-cors torch torchvision pillow timm

# Check if model files exist
ls AI_MODELS/plant_disease_efficientnet.pt
ls AI_MODELS/class_indices.json
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5000
kill -9 <PID>
```

### Ollama Not Responding
```bash
# Check Ollama status
ollama list

# Restart Ollama
ollama serve

# Pull model if missing
ollama pull llama3
```

## 🧪 Testing

### Run Integration Tests
```bash
cd backend
node test_integration.js
```

### Verify Database
```bash
cd backend
node verify_db.js
```

### Test ML Service
```bash
curl http://localhost:5001/health
```

## 📊 Database Schema

### Scan Model
```javascript
{
  disease: String,
  confidence: Number (0-1),
  severity: String (High|Moderate|Uncertain),
  scenario: String (farm_monitoring|home_gardener|agricultural_training),
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

## 🔒 Security Considerations

- Input validation on all endpoints
- File type restrictions for uploads
- MongoDB injection prevention
- CORS configuration
- Environment variable protection
- Secure file storage

## 🚀 Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB URI
- [ ] Set up reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Configure backup strategy
- [ ] Optimize model loading
- [ ] Enable compression
- [ ] Set up logging

## 📈 Performance Optimization

- Model caching in ML service
- Database indexing on timestamp and disease fields
- Image compression before storage
- CDN for static assets
- Connection pooling for MongoDB
- Response caching for frequent queries

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- PlantVillage Dataset
- EfficientNet architecture
- Ollama team for LLM integration
- Open source community

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@agrodetect.ai
- Documentation: https://docs.agrodetect.ai

## 🗺️ Roadmap

- [ ] Mobile application (React Native)
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Advanced analytics dashboard
- [ ] Integration with weather APIs
- [ ] Crop yield prediction
- [ ] Pest detection
- [ ] Soil analysis integration

---

**Made with ❤️ for sustainable agriculture**
#   p l a n t _ d i s e a s e _ d e t e c t i o n  
 