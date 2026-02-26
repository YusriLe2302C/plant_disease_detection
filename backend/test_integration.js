const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://localhost:5001';
const OLLAMA_URL = 'http://localhost:11434';

console.log('🔍 AgroDetect AI - Integration Test\n');

async function testDatabase() {
  console.log('📊 Testing Database Connection...');
  try {
    await mongoose.connect('mongodb://localhost:27017/plantcare_ai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB Connected\n');
    
    const Scan = require('./models/scan.model');
    const count = await Scan.countDocuments();
    console.log(`   📁 Total scans in database: ${count}\n`);
    
    return true;
  } catch (error) {
    console.log(`❌ MongoDB Error: ${error.message}\n`);
    return false;
  }
}

async function testMLService() {
  console.log('🤖 Testing ML Service...');
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    console.log('✅ ML Service Online');
    console.log(`   Device: ${response.data.device}`);
    console.log(`   Model Loaded: ${response.data.model_loaded}\n`);
    return true;
  } catch (error) {
    console.log(`❌ ML Service Error: ${error.message}`);
    console.log('   💡 Start with: cd AI_MODELS && python ml_service.py\n');
    return false;
  }
}

async function testOllama() {
  console.log('🧠 Testing Ollama AI...');
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    console.log('✅ Ollama Online');
    console.log(`   Models: ${response.data.models?.length || 0} available\n`);
    return true;
  } catch (error) {
    console.log(`❌ Ollama Error: ${error.message}`);
    console.log('   💡 Start with: ollama serve\n');
    return false;
  }
}

async function testBackend() {
  console.log('🌐 Testing Backend Server...');
  try {
    const response = await axios.get(`${BACKEND_URL}/`, { timeout: 5000 });
    console.log('✅ Backend Server Online');
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Features: ${response.data.features?.length || 0}\n`);
    return true;
  } catch (error) {
    console.log(`❌ Backend Error: ${error.message}`);
    console.log('   💡 Start with: npm start\n');
    return false;
  }
}

async function testEndpoints() {
  console.log('🔗 Testing API Endpoints...');
  
  const endpoints = [
    { method: 'GET', url: `${BACKEND_URL}/api/analysis/history`, name: 'History' },
    { method: 'GET', url: `${BACKEND_URL}/api/ai/health`, name: 'AI Health' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      await axios({ method: endpoint.method, url: endpoint.url, timeout: 5000 });
      console.log(`   ✅ ${endpoint.name}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');
}

async function testFileStructure() {
  console.log('📁 Testing File Structure...');
  
  const requiredFiles = [
    'AI_MODELS/best_model.pt',
    'AI_MODELS/class_indices.json',
    'AI_MODELS/ml_service.py',
    'backend/server.js',
    'backend/ml_predictor.js',
    'backend/models/scan.model.js',
    'backend/config/database.js',
    'frontend/src/App.jsx'
  ];
  
  let allExist = true;
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allExist = false;
    }
  }
  console.log('');
  return allExist;
}

async function testUploadDirectory() {
  console.log('📂 Testing Upload Directory...');
  const uploadDir = path.join(__dirname, 'uploads', 'plant_images');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('   ✅ Created uploads/plant_images\n');
  } else {
    const files = fs.readdirSync(uploadDir);
    console.log(`   ✅ Upload directory exists (${files.length} files)\n`);
  }
  return true;
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════\n');
  
  const results = {
    fileStructure: await testFileStructure(),
    uploadDir: await testUploadDirectory(),
    database: await testDatabase(),
    mlService: await testMLService(),
    ollama: await testOllama(),
    backend: await testBackend()
  };
  
  if (results.backend) {
    await testEndpoints();
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 SUMMARY\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}\n`);
  
  if (passed === total) {
    console.log('🎉 All systems operational!\n');
  } else {
    console.log('⚠️  Some services need attention\n');
    console.log('Quick Start Guide:');
    console.log('1. MongoDB: mongod --dbpath <path>');
    console.log('2. ML Service: cd AI_MODELS && python ml_service.py');
    console.log('3. Ollama: ollama serve');
    console.log('4. Backend: cd backend && npm start');
    console.log('5. Frontend: cd frontend && npm run dev\n');
  }
  
  mongoose.connection.close();
  process.exit(passed === total ? 0 : 1);
}

runAllTests();
