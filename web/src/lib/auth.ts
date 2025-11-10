import axios, { AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  RegisterRequest, 
  ResetPasswordRequest, 
  ConfirmResetPasswordRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  AuthResponse, 
  RefreshTokenResponse 
} from '@/types/auth';

// Configuration de l'API d'authentification
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs d'authentification
authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expiré ou invalide (uniquement côté client)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authApi = {
  // Connexion
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await authClient.post('/api/auth/login', credentials);
    return response.data;
  },

  // Inscription
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await authClient.post('/api/auth/register', data);
    return response.data;
  },

  // Rafraîchissement du token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response: AxiosResponse<RefreshTokenResponse> = await authClient.post('/api/auth/refresh', {
      refreshToken
    });
    return response.data;
  },

  // Demande de réinitialisation de mot de passe
  requestPasswordReset: async (data: ResetPasswordRequest): Promise<void> => {
    await authClient.post('/api/auth/forgot-password', data);
  },

  // Confirmation de réinitialisation de mot de passe
  confirmPasswordReset: async (data: ConfirmResetPasswordRequest): Promise<void> => {
    await authClient.post('/api/auth/reset-password', data);
  },

  // Vérification d'email
  verifyEmail: async (data: { email: string; token: string }): Promise<void> => {
    await authClient.post('/api/auth/verify-email', data);
  },

  // Renvoyer l'email de vérification
  resendVerificationEmail: async (data: { email: string; organizationDomain: string }): Promise<void> => {
    await authClient.post('/api/auth/resend-verification', data);
  },

  // Déconnexion
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await authClient.post('/api/auth/logout', { refreshToken });
    } catch (error) {
      // Ignorer les erreurs de déconnexion côté serveur
      console.warn('Logout request failed:', error);
    }
  },
};

// Utilitaires de gestion des tokens
export const tokenUtils = {
  // Sauvegarder les tokens
  saveTokens: (authResponse: AuthResponse) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', authResponse.accessToken);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    localStorage.setItem('organization', JSON.stringify(authResponse.organization));
    localStorage.setItem('tokenExpiry', authResponse.expiresAt);
  },

  // Récupérer le token d'accès
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  // Récupérer le token de rafraîchissement
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },

  // Récupérer les informations utilisateur
  getUser: (): any | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Récupérer les informations de l'organisation
  getOrganization: (): any | null => {
    if (typeof window === 'undefined') return null;
    const orgStr = localStorage.getItem('organization');
    return orgStr ? JSON.parse(orgStr) : null;
  },

  // Vérifier si le token est expiré
  isTokenExpired: (): boolean => {
    if (typeof window === 'undefined') return true;
    const expiryStr = localStorage.getItem('tokenExpiry');
    if (!expiryStr) return true;
    
    const expiry = new Date(expiryStr);
    const now = new Date();
    return now >= expiry;
  },

  // Nettoyer tous les tokens
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    localStorage.removeItem('tokenExpiry');
  },
};

export default authClient;
