// frontend/src/services/api.ts

import axios, { 
  AxiosError, 
  InternalAxiosRequestConfig, 
  AxiosResponse 
} from 'axios';

// Assicurati che questo URL corrisponda alla configurazione del tuo backend
const API_URL = 'http://localhost:8000/api/v1';

// Log per il debug, utile durante lo sviluppo
console.log('API URL utilizzato:', API_URL);

/**
 * Istanza Axios configurata per comunicare con l'API backend.
 * Gestisce automaticamente l'autenticazione e il refresh dei token.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor per le richieste in uscita.
 * Aggiunge automaticamente il token di autenticazione a tutte le richieste,
 * se disponibile nel localStorage.
 */
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

/**
 * Interceptor per le risposte.
 * Gestisce automaticamente i token scaduti (401) tentando di ottenere 
 * un nuovo token di accesso tramite il refresh token, e riprovando poi
 * la richiesta originale.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Se riceve un 401 (Unauthorized) e non ha già tentato di rifare la richiesta
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Imposta il flag _retry per evitare loop infiniti
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Nessun refresh token');
        }
        
        // Tenta di ottenere un nuovo access token usando il refresh token
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        if (response.data.status === 'success') {
          // Salva il nuovo access token
          localStorage.setItem('accessToken', response.data.data.access);
          
          // Riprova la richiesta originale con il nuovo token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.data.access}`;
          }
          return api(originalRequest);
        } else {
          throw new Error('Refresh fallito');
        }
      } catch (err) {
        // Se il refresh token è scaduto o invalido, effettua il logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Reindirizza alla pagina di login
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    // Per tutti gli altri errori, li propaga semplicemente
    return Promise.reject(error);
  }
);

export default api;