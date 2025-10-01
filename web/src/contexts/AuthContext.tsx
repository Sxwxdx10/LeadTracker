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
// Import removed - will use direct toast calls

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
        // Vérifier si on est côté client
        if (typeof window === 'undefined') {
          dispatch({ type: 'AUTH_SET_LOADING', payload: false });
          return;
        }

        const accessToken = tokenUtils.getAccessToken();
        const refreshToken = tokenUtils.getRefreshToken();
        const user = tokenUtils.getUser();
        const organization = tokenUtils.getOrganization();

        if (accessToken && refreshToken && user && organization) {
          // Vérifier si le token est expiré
          if (tokenUtils.isTokenExpired()) {
            // Essayer de rafraîchir le token avec timeout
            try {
              const refreshPromise = authApi.refreshToken(refreshToken);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              );
              
              const refreshResponse = await Promise.race([refreshPromise, timeoutPromise]) as any;
              
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
              console.warn('Erreur lors du refresh du token:', error);
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

    // Délai pour éviter les problèmes d'hydratation
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fonction de connexion
  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Mode démonstration - simulation de la connexion
      const isDemoMode = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;
      
      if (isDemoMode) {
        // Simulation d'une connexion réussie
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler le délai réseau
        
        const mockResponse = {
          accessToken: 'demo-access-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'demo-user-' + Date.now(),
            firstName: 'Utilisateur',
            lastName: 'Démo',
            email: credentials.email,
            fullName: 'Utilisateur Démo',
            jobTitle: 'Utilisateur démo',
            roles: ['admin']
          },
          organization: {
            id: 'demo-org-' + Date.now(),
            name: 'Organisation Démo',
            domain: 'demo-org',
            description: 'Organisation de démonstration'
          }
        };
        
        tokenUtils.saveTokens(mockResponse);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: mockResponse.user,
            organization: mockResponse.organization,
            accessToken: mockResponse.accessToken,
            refreshToken: mockResponse.refreshToken,
          },
        });

        console.log('Connexion en mode démo réussie !');
        return;
      }
      
      // Mode normal - appel API réel
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

      console.log('Connexion réussie !');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      console.error(errorMessage);
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (data: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Mode démonstration - simulation de l'inscription
      const isDemoMode = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;
      
      if (isDemoMode) {
        // Simulation d'une inscription réussie
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simuler le délai réseau
        
        const mockResponse = {
          accessToken: 'demo-access-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'demo-user-' + Date.now(),
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            fullName: `${data.firstName} ${data.lastName}`,
            jobTitle: 'Utilisateur démo',
            roles: ['admin']
          },
          organization: {
            id: 'demo-org-' + Date.now(),
            name: data.organizationName,
            domain: data.organizationDomain || 'demo-org',
            description: data.organizationDescription || 'Organisation de démonstration'
          }
        };
        
        tokenUtils.saveTokens(mockResponse);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: mockResponse.user,
            organization: mockResponse.organization,
            accessToken: mockResponse.accessToken,
            refreshToken: mockResponse.refreshToken,
          },
        });

        console.log('Inscription en mode démo réussie !');
        return;
      }
      
      // Mode normal - appel API réel
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

      console.log('Inscription réussie !');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      console.error(errorMessage);
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
      console.log('Déconnexion réussie');
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
