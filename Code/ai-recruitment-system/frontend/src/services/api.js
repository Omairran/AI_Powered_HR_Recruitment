/**
 * API Service for Candidate Operations
 * Centralized API calls for better maintainability
 */
import axios from 'axios';

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for future auth tokens)
api.interceptors.request.use(
  (config) => {
    // Add authentication token here
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Candidate API endpoints
 */
const candidateAPI = {
  /**
   * Parse resume without saving (for review step)
   * @param {File} resumeFile - Resume file to parse
   * @returns {Promise} API response with parsed data
   */
  parseResume: (resumeFile) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    
    return api.post('/candidates/parse_resume_only/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Submit a new candidate application
   * @param {FormData} formData - Form data with candidate info and resume
   * @returns {Promise} API response
   */
  apply: (formData) => {
    return api.post('/candidates/apply/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get all candidates (admin use)
   * @param {Object} params - Query parameters (e.g., status filter)
   * @returns {Promise} API response
   */
  getAll: (params = {}) => {
    return api.get('/candidates/', { params });
  },

  /**
   * Get a specific candidate by ID
   * @param {number} id - Candidate ID
   * @returns {Promise} API response
   */
  getById: (id) => {
    return api.get(`/candidates/${id}/`);
  },

  /**
   * Update a candidate
   * @param {number} id - Candidate ID
   * @param {Object|FormData} data - Updated candidate data
   * @returns {Promise} API response
   */
  update: (id, data) => {
    const headers = data instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : {};
    return api.patch(`/candidates/${id}/update/`, data, { headers });
  },

  /**
   * Delete a candidate
   * @param {number} id - Candidate ID
   * @returns {Promise} API response
   */
  delete: (id) => {
    return api.delete(`/candidates/${id}/delete/`);
  },
};

export { api, candidateAPI };
export default candidateAPI;