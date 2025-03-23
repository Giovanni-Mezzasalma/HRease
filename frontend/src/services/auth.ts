// frontend/src/services/auth.ts

import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface ResetPasswordConfirm {
  uid: string;
  token: string;
  new_password: string;
}

interface AuthResponse {
  status: string;
  data: {
    access: string;
    refresh: string;
    user: User;
  };
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Utilizza il percorso corretto dell'API come definito nel backend
  const response = await api.post('/auth/login/', credentials);
  return response.data;
};

export const requestPasswordReset = async (data: ResetPasswordRequest) => {
  const response = await api.post('/auth/password-reset/', data);
  return response.data;
};

export const confirmPasswordReset = async (data: ResetPasswordConfirm) => {
  const response = await api.post('/auth/password-reset/confirm/', data);
  return response.data;
};

export const fetchUserProfile = async (): Promise<User> => {
  const response = await api.get('/users/me/');
  return response.data.data;
};

export const checkAuthStatus = (): boolean => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  return !!(token && user);
};