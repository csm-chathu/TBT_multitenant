import axios from 'axios';
import { getToken, removeToken, isTokenValid } from '@/lib/jwt';

// Create a navigation callback that can be set from components
let navigationCallback: ((path: string) => void) | null = null;

export const setNavigationCallback = (callback: (path: string) => void) => {
  navigationCallback = callback;
};

const api = axios.create({
  // baseURL: 'https://nestjstbt.elifeamerica.com/api/v1', // Use proxy instead of direct localhost
  // baseURL: 'http://localhost:5174/api/v1', // Use proxy instead of direct localhost
   baseURL: '/api/v1', // Use proxy instead of direct localhost
  // withCredentials: true, // if you're using cookies
});

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    // Only attach token if it exists and is valid (not expired)
    if (token && isTokenValid(token)) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (token) {
      // Token exists but is expired, remove it
      removeToken();
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and redirect to login
      removeToken();
      
      // Use navigation callback if available, otherwise fall back to window.location
      if (navigationCallback) {
        navigationCallback('/login');
      } else {
        // Fallback for cases where navigation callback is not set
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
