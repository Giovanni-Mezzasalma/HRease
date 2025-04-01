// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginService, fetchUserProfile, checkAuthStatus } from '../services/auth';
import logger from '../utils/logger';

/**
 * Interfaccia che definisce la struttura dei dati utente.
 * Contiene le informazioni di base dell'utente autenticato.
 */
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
}

/**
 * Interfaccia che definisce il contratto del context di autenticazione.
 * Espone lo stato e i metodi relativi all'autenticazione utente.
 */
interface AuthContextType {
  user: User | null;              // Dati dell'utente autenticato o null
  isAuthenticated: boolean;       // Flag per indicare se l'utente è autenticato
  isLoading: boolean;             // Flag per indicare se è in corso un caricamento
  login: (email: string, password: string) => Promise<void>;  // Funzione di login
  logout: () => void;             // Funzione di logout
}

// Creazione del context con valore undefined iniziale
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personalizzato per accedere facilmente al context di autenticazione.
 * Lancia un errore se utilizzato al di fuori di un AuthProvider.
 * 
 * @returns Il context di autenticazione
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Props per il componente AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode;  // Componenti figli che avranno accesso al context
}

/**
 * Provider di autenticazione che gestisce lo stato dell'autenticazione utente.
 * Fornisce funzionalità di login, logout e verifica dello stato di autenticazione.
 * 
 * @param children - Componenti figli che avranno accesso al context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Stato per i dati dell'utente
  const [user, setUser] = useState<User | null>(null);
  // Stato per indicare se l'utente è autenticato
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Stato per indicare se è in corso un caricamento (es. verifica token)
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Effect che verifica lo stato di autenticazione all'avvio dell'app.
   * Controlla se esiste un token valido e recupera i dati dell'utente.
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      logger.info('Initializing authentication state');
      
      try {
        // Verifica se c'è un token valido
        if (checkAuthStatus()) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            // Se i dati utente sono in localStorage, li utilizza
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else {
            // Se c'è un token ma nessun dato utente, li recupera dal server
            logger.info('Token found but no user data, fetching profile');
            const userData = await fetchUserProfile();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAuthenticated(true);
            logger.info('User profile fetched successfully', { userId: userData.id });
          }
        }else {
          logger.info('No valid authentication found');
        }
      } catch (error) {
        logger.error('Error during auth initialization', { error: error instanceof Error ? error.message : String(error) });
        // In caso di errore, esegue il logout
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Effettua il login dell'utente.
   * 
   * @param email - Email dell'utente
   * @param password - Password dell'utente
   * @returns Promise che si risolve quando il login è completato
   * @throws Error se il login fallisce
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await loginService({ email, password });
      
      if (response.status === 'success') {
        const { access, refresh, user: userData } = response.data;
        
        // Salva token e dati utente nel localStorage
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Aggiorna lo stato
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Effettua il logout dell'utente.
   * Rimuove i token e i dati utente dal localStorage e resetta lo stato.
   */
  const logout = () => {
    logger.info('User logging out', { userId: user?.id });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Valori da esporre nel context
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};