// frontend/src/services/auth.ts

import api from './api';

/**
 * Interfaccia per le credenziali di login.
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interfaccia per la richiesta di reset password.
 */
interface ResetPasswordRequest {
  email: string;
}

/**
 * Interfaccia per la conferma del reset password.
 */
interface ResetPasswordConfirm {
  uid: string;
  token: string;
  new_password: string;
}

/**
 * Interfaccia per la risposta di autenticazione.
 */
interface AuthResponse {
  status: string;
  data: {
    access: string;
    refresh: string;
    user: User;
  };
}

/**
 * Interfaccia per i dati utente.
 */
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
}

/**
 * Effettua il login dell'utente.
 * 
 * @param credentials - Credenziali di login (email e password)
 * @returns Promise con la risposta di autenticazione
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Utilizza il percorso corretto dell'API come definito nel backend
  const response = await api.post('/auth/login/', credentials);
  return response.data;
};

/**
 * Invia una richiesta di reset password.
 * 
 * @param data - Oggetto contenente l'email dell'utente
 * @returns Promise con la risposta del server
 */
export const requestPasswordReset = async (data: ResetPasswordRequest) => {
  const response = await api.post('/auth/password-reset/', data);
  return response.data;
};

/**
 * Conferma il reset della password usando il token ricevuto via email.
 * 
 * @param data - Dati per la conferma del reset (uid, token, nuova password)
 * @returns Promise con la risposta del server
 */
export const confirmPasswordReset = async (data: ResetPasswordConfirm) => {
  const response = await api.post('/auth/password-reset/confirm/', data);
  return response.data;
};

/**
 * Recupera il profilo dell'utente corrente.
 * 
 * @returns Promise con i dati dell'utente
 */
export const fetchUserProfile = async (): Promise<User> => {
  const response = await api.get('/users/me/');
  return response.data.data;
};

/**
 * Verifica se l'utente è attualmente autenticato 
 * controllando la presenza di token e dati utente.
 * 
 * @returns boolean che indica se l'utente è autenticato
 */
export const checkAuthStatus = (): boolean => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  return !!(token && user);  // Converte in boolean
};