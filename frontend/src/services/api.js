import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Container endpoints
export const containerAPI = {
  getAll: () => api.get('/containers'),
  getById: (id) => api.get(`/containers/${id}`),
  getHistory: (id, days = 7) => api.get(`/containers/${id}/history?days=${days}`),
  updateThreshold: (id, threshold) => api.patch(`/containers/${id}/threshold`, { threshold }),
  getAlerts: (id) => api.get(`/containers/${id}/alerts`),
};

// Shipment endpoints
export const shipmentAPI = {
  getAll: () => api.get('/shipments'),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  updateStatus: (id, status) => api.patch(`/shipments/${id}/status`, { status }),
  getAuditTrail: (id) => api.get(`/shipments/${id}/audit`),
};

// Analytics endpoints
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getTrends: (period = 'week') => api.get(`/analytics/trends?period=${period}`),
  getPredictions: (containerId) => api.get(`/analytics/predictions/${containerId}`),
  exportReport: (format = 'csv') => api.get(`/analytics/export?format=${format}`, {
    responseType: 'blob',
  }),
};

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

export default api;
