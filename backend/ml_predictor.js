const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

async function runPrediction(imagePath) {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('ML service not running. Start ml_service.py on port 5001');
    }
    
    // Handle leaf detection rejection
    if (error.response && error.response.status === 400 && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error && errorData.error.includes('No plant leaf detected')) {
        throw new Error(`NOT_A_LEAF: ${errorData.message || 'Please upload a clear image of a plant leaf'}`);
      }
    }
    
    throw new Error(`ML prediction failed: ${error.message}`);
  }
}

async function checkMLHealth() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
}

module.exports = { runPrediction, checkMLHealth };
