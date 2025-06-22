import axios from 'axios';
import { handleError, extractErrorInfo, ERROR_TYPES } from './errorHandler';

// Configure base URL based on environment
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || '';
  }
  return ''; // Use proxy in development
};

// Set base URL for production
if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = getBaseURL();
}

// Set default headers
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 30000; // 30 second timeout

// Add support for credentials in production
if (process.env.NODE_ENV === 'production') {
  axios.defaults.withCredentials = false; // Set to true if you need cookies
}

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Add CORS headers for production
    if (process.env.NODE_ENV === 'production') {
      config.headers['Access-Control-Allow-Origin'] = '*';
      config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      config.headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, X-Auth-Token, Authorization';
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }

    return response;
  },
  (error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      const errorInfo = extractErrorInfo(error);
      console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        message: errorInfo.message,
        data: error.response?.data
      });
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.warn('Access denied:', error.response.data);
    } else if (error.response?.status >= 500) {
      // Server error - could implement retry logic here
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Enhanced API wrapper functions with better error handling for production
export const apiRequest = {
  get: async (url, config = {}) => {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      // In production, provide user-friendly error messages
      if (process.env.NODE_ENV === 'production' && isNetworkError(error)) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      const response = await axios.post(url, data, config);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'production' && isNetworkError(error)) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  },

  put: async (url, data = {}, config = {}) => {
    try {
      const response = await axios.put(url, data, config);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'production' && isNetworkError(error)) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  },

  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await axios.patch(url, data, config);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'production' && isNetworkError(error)) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await axios.delete(url, config);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'production' && isNetworkError(error)) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  }
};

// Utility function to check if error is a network error
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

// Utility function to check if error is a timeout error
export const isTimeoutError = (error) => {
  return error.code === 'ECONNABORTED' || error.message.includes('timeout');
};

// Utility function to check if error is retriable
export const isRetriableError = (error) => {
  if (isNetworkError(error) || isTimeoutError(error)) return true;
  
  const status = error.response?.status;
  return status === 429 || status >= 500;
};

// Health check function for production monitoring
export const healthCheck = async () => {
  try {
    const response = await apiRequest.get('/api/health');
    return response;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default axios; 