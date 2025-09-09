'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authApi, tokenUtils } from '@/lib/auth';
import { 
  AuthState, 
  AuthContextType, 
  LoginRequest, 
  RegisterRequest, 
  UserInfo, 
  OrganizationInfo 
} from '@/types/auth';
import { toast } from 'react-hot-toast';

// État initial
const initialState: AuthState = {
  user: null,
  organization: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Types d'actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: UserInfo; organization: OrganizationInfo; accessToken: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_SET_LOADING'; payload: boolean };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        organization: action.payload.organization,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        organization: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        organization: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

// Créer le contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialiser l'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = tokenUtils.getAccessToken();
        const refreshToken = tokenUtils.getRefreshToken();
        const user = tokenUtils.getUser();
        const organization = tokenUtils.getOrganization();

        if (accessToken && refreshToken && user && organization) {
          // Vérifier si le token est expiré
          if (tokenUtils.isTokenExpired()) {
            // Essayer de rafraîchir le token
            try {
              const refreshResponse = await authApi.refreshToken(refreshToken);
              tokenUtils.saveTokens({
                accessToken: refreshResponse.accessToken,
                refreshToken: refreshResponse.refreshToken,
                expiresAt: refreshResponse.expiresAt,
                user,
                organization,
              });

              dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                  user,
                  organization,
                  accessToken: refreshResponse.accessToken,
                  refreshToken: refreshResponse.refreshToken,
                },
              });
            } catch (error) {
              // Token de rafraîchissement invalide, déconnecter
              tokenUtils.clearTokens();
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          } else {
            // Token valide
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user,
                organization,
                accessToken,
                refreshToken,
              },
            });
          }
        } else {
          dispatch({ type: 'AUTH_SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'AUTH_SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Fonction de connexion
  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authApi.login(credentials);
      tokenUtils.saveTokens(response);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          organization: response.organization,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });

      toast.success('Connexion réussie !');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (data: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authApi.register(data);
      tokenUtils.saveTokens(response);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          organization: response.organization,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });

      toast.success('Inscription réussie !');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      tokenUtils.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
      toast.success('Déconnexion réussie');
    }
  };

  // Fonction de rafraîchissement du token
  const refreshAuth = async () => {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(refreshToken);
      const user = tokenUtils.getUser();
      const organization = tokenUtils.getOrganization();

      if (user && organization) {
        tokenUtils.saveTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,
          user,
          organization,
        });

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            organization,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenUtils.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
