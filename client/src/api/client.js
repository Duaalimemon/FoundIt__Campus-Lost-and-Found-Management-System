import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor: attach staff token from sessionStorage if present (Section 3.3)
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('foundit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: format errors and handle 401 token invalidation (Section 3.3, 7.4)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Clear invalid/expired token on 401
      if (error.response.status === 401) {
        sessionStorage.removeItem('foundit_token');
      }
      return Promise.reject(error.response.data || {
        success: false,
        message: error.response.statusText || 'Request failed'
      });
    }
    return Promise.reject({
      success: false,
      message: error.message || 'Network error occurred. Please check your connection.'
    });
  }
);
