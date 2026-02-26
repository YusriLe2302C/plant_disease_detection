import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadImage = async (formData) => {
  return api.post('/analysis/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHistory = async (page = 1, limit = 10) => {
  return api.get(`/analysis/history?page=${page}&limit=${limit}`);
};

export const getScanById = async (id) => {
  return api.get(`/analysis/${id}`);
};

export const espStatus = async (data) => {
  return api.post('/analysis/esp-status', data);
};

export const espDisable = async (device_id) => {
  return api.post('/analysis/esp-disable', { device_id });
};

export const espEnable = async (device_id) => {
  return api.post('/analysis/esp-enable', { device_id });
};

export const chatWithAI = async (message, scenario) => {
  return api.post('/ai/chat', { message, scenario });
};

export const deleteScan = async (id) => {
  return api.delete(`/analysis/${id}`);
};

export default api;
