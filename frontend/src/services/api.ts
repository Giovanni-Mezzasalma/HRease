// frontend/src/services/api.ts

import axios, { 
  AxiosError, 
  InternalAxiosRequestConfig, 
  AxiosResponse 
} from 'axios';

// Assicurati che questo URL corrisponda alla configurazione del tuo backend
const API_URL = 'http://localhost:8000/api/v1';

console.log('API URL utilizzato:', API_URL); // Utile per il debug

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere token alle richieste
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire refresh token su 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Evita loop infinito
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Nessun refresh token');
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        if (response.data.status === 'success') {
          localStorage.setItem('accessToken', response.data.data.access);
          
          // Riprova la richiesta originale
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.data.access}`;
          }
          return api(originalRequest);
        } else {
          throw new Error('Refresh fallito');
        }
      } catch (err) {
        // Logout utente se il refresh fallisce
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Reindirizza al login
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;