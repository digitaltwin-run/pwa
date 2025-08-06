/**
 * API Service
 * A service layer for making API calls to the backend
 */

import httpClient from '../utils/http-client.js';
import eventBus from '../utils/event-bus.js';
import i18n from '../utils/i18n.js';

class ApiService {
  constructor() {
    // Add request interceptor for authentication
    httpClient.addRequestInterceptor(async (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` };
      }
      return config;
    });
    
    // Add response interceptor for error handling
    httpClient.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        if (!window.location.pathname.includes('/login')) {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
          eventBus.emit('auth:unauthorized', { 
            message: i18n.t('errors.session_expired'),
            redirectUrl: '/login'
          });
        }
        const error = new Error(i18n.t('errors.unauthorized'));
        error.status = 401;
        throw error;
      }
      return response;
    });
  }
  
  // Auth API
  auth = {
    login: async (email, password) => {
      const response = await httpClient.post('/api/auth/login', { email, password });
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        eventBus.emit('auth:login', { user: response.user });
      }
      return response;
    },
    
    logout: async () => {
      try {
        await httpClient.post('/api/auth/logout');
      } finally {
        localStorage.removeItem('authToken');
        eventBus.emit('auth:logout');
      }
    },
    
    getProfile: async () => httpClient.get('/api/auth/me'),
    
    refreshToken: async () => {
      const response = await httpClient.post('/api/auth/refresh-token');
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      return response;
    },
    
    requestPasswordReset: async (email) => 
      httpClient.post('/api/auth/forgot-password', { email }),
    
    resetPassword: async (token, newPassword) => 
      httpClient.post('/api/auth/reset-password', { token, newPassword })
  };
  
  // Users API
  users = {
    list: async (params = {}) => httpClient.get('/api/users', { params }),
    get: async (id) => httpClient.get(`/api/users/${id}`),
    create: async (userData) => httpClient.post('/api/users', userData),
    update: async (id, userData) => httpClient.put(`/api/users/${id}`, userData),
    delete: async (id) => httpClient.delete(`/api/users/${id}`),
    updateProfile: async (profileData) => httpClient.put('/api/users/me', profileData),
    changePassword: async (currentPassword, newPassword) => 
      httpClient.post('/api/users/change-password', { currentPassword, newPassword })
  };
  
  // Digital Twins API
  digitalTwins = {
    list: async (params = {}) => httpClient.get('/api/digital-twins', { params }),
    get: async (id) => httpClient.get(`/api/digital-twins/${id}`),
    create: async (twinData) => httpClient.post('/api/digital-twins', twinData),
    update: async (id, twinData) => httpClient.put(`/api/digital-twins/${id}`, twinData),
    delete: async (id) => httpClient.delete(`/api/digital-twins/${id}`),
    getTelemetry: async (id, params = {}) => 
      httpClient.get(`/api/digital-twins/${id}/telemetry`, { params }),
    sendCommand: async (id, command, payload = {}) => 
      httpClient.post(`/api/digital-twins/${id}/commands/${command}`, payload),
    getModel: async (id) => httpClient.get(`/api/digital-twins/${id}/model`),
    updateModel: async (id, modelData) => 
      httpClient.put(`/api/digital-twins/${id}/model`, modelData)
  };
  
  // Components API
  components = {
    list: async (params = {}) => httpClient.get('/api/components', { params }),
    get: async (id) => httpClient.get(`/api/components/${id}`),
    getSchema: async (id) => httpClient.get(`/api/components/${id}/schema`),
    getDocumentation: async (id) => httpClient.get(`/api/components/${id}/docs`)
  };
  
  // Projects API
  projects = {
    list: async (params = {}) => httpClient.get('/api/projects', { params }),
    get: async (id) => httpClient.get(`/api/projects/${id}`),
    create: async (projectData) => httpClient.post('/api/projects', projectData),
    update: async (id, projectData) => httpClient.put(`/api/projects/${id}`, projectData),
    delete: async (id) => httpClient.delete(`/api/projects/${id}`),
    getMembers: async (id) => httpClient.get(`/api/projects/${id}/members`),
    addMember: async (id, userId, role) => 
      httpClient.post(`/api/projects/${id}/members`, { userId, role }),
    updateMemberRole: async (id, userId, role) => 
      httpClient.put(`/api/projects/${id}/members/${userId}`, { role }),
    removeMember: async (id, userId) => 
      httpClient.delete(`/api/projects/${id}/members/${userId}`),
    getSettings: async (id) => httpClient.get(`/api/projects/${id}/settings`),
    updateSettings: async (id, settings) => 
      httpClient.put(`/api/projects/${id}/settings`, settings)
  };
  
  // Files API
  files = {
    upload: async (file, options = {}) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options.folder) formData.append('folder', options.folder);
      
      return httpClient.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: options.onProgress
      });
    },
    
    get: async (id) => httpClient.get(`/api/files/${id}`),
    getContent: async (id) => httpClient.get(`/api/files/${id}/content`, { responseType: 'text' }),
    download: async (id, filename) => 
      httpClient.get(`/api/files/${id}/download`, { 
        responseType: 'blob',
        headers: filename ? { 'X-Filename': filename } : {}
      }),
    delete: async (id) => httpClient.delete(`/api/files/${id}`),
    list: async (path = '') => httpClient.get('/api/files', { params: { path } }),
    createDirectory: async (path) => httpClient.post('/api/files/directories', { path })
  };
  
  // Settings API
  settings = {
    get: async () => httpClient.get('/api/settings'),
    update: async (settings) => httpClient.put('/api/settings', settings),
    getPublicSettings: async () => httpClient.get('/api/settings/public')
  };
  
  // Utils
  utils = {
    healthCheck: async () => httpClient.get('/api/health'),
    getAppVersion: async () => httpClient.get('/api/version'),
    getSystemInfo: async () => httpClient.get('/api/system/info')
  };
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;
