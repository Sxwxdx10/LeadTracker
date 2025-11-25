import axios, { AxiosResponse } from 'axios';
import { 
  Lead, 
  CreateLeadDto, 
  UpdateLeadDto, 
  LeadQueryParams, 
  PaginatedLeadsResponse,
  LeadStats,
  Stage,
  SearchSuggestion
} from '@/types/lead';

// Configuration de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Ajouter l'ID de l'organisation pour le multi-tenant
      const organization = localStorage.getItem('organization');
      if (organization) {
        const orgData = JSON.parse(organization);
        config.headers['X-Org-Id'] = orgData.id;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag pour éviter les redirections multiples
let isRedirecting = false;

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Ne pas traiter les erreurs si on est déjà en train de rediriger
    if (isRedirecting) {
      return Promise.reject(error);
    }
    
    // Si erreur 401 et pas déjà en cours de rafraîchissement (uniquement côté client)
    if (typeof window !== 'undefined' && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Importer dynamiquement pour éviter les dépendances circulaires
          const { authApi } = await import('./auth');
          const response = await authApi.refreshToken(refreshToken);
          
          // Sauvegarder le nouveau token
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const organization = JSON.parse(localStorage.getItem('organization') || '{}');
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('tokenExpiry', response.expiresAt);
          
          // Retry la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token de rafraîchissement invalide, rediriger vers login seulement si on n'est pas déjà sur /login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          isRedirecting = true;
          localStorage.clear();
          // Utiliser replace au lieu de href pour éviter l'historique
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Pour les erreurs réseau (404, timeout, etc.), ne pas rediriger automatiquement
    // Seulement logger l'erreur
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.error('API Error (Network/404):', error.message || error.response?.statusText);
      // Ne pas rejeter pour les erreurs 404 sur certaines routes (comme les endpoints optionnels)
      if (originalRequest?.url?.includes('/organization/')) {
        // Ces endpoints sont optionnels, retourner une erreur silencieuse
        return Promise.reject(error);
      }
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Services API pour les leads
export const leadsApi = {
  // Get search suggestions for full-text search
  getSearchSuggestions: async (query: string, limit: number = 10): Promise<SearchSuggestion[]> => {
    const response: AxiosResponse<SearchSuggestion[]> = await apiClient.get(
      `/api/leads/search-suggestions?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  },

  // Récupérer la liste paginée des leads
  getLeads: async (params?: LeadQueryParams): Promise<PaginatedLeadsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('pageNumber', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params?.stageId) queryParams.append('stageId', params.stageId);
    if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.createdFrom) queryParams.append('createdFrom', params.createdFrom);
    if (params?.createdTo) queryParams.append('createdTo', params.createdTo);
    
    const response: AxiosResponse<PaginatedLeadsResponse> = await apiClient.get(
      `/api/leads?${queryParams.toString()}`
    );
    
    return response.data;
  },

  // Récupérer un lead par ID
  getLead: async (id: string): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await apiClient.get(`/api/leads/${id}`);
    return response.data;
  },

  // Créer un nouveau lead
  createLead: async (data: CreateLeadDto): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await apiClient.post('/api/leads', data);
    return response.data;
  },

  // Mettre à jour un lead
  updateLead: async (id: string, data: UpdateLeadDto): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await apiClient.put(`/api/leads/${id}`, data);
    return response.data;
  },

  // Supprimer un lead
  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/leads/${id}`);
  },

  // Récupérer les statistiques des leads
  getLeadStats: async (): Promise<LeadStats> => {
    const response: AxiosResponse<LeadStats> = await apiClient.get('/api/leads/stats');
    return response.data;
  },
};

// Services API pour les stages
export const stagesApi = {
  // Récupérer tous les stages
  getStages: async (): Promise<Stage[]> => {
    const response: AxiosResponse<Stage[]> = await apiClient.get('/api/stages');
    return response.data;
  },

  // Récupérer un stage par ID
  getStage: async (id: string): Promise<Stage> => {
    const response: AxiosResponse<Stage> = await apiClient.get(`/api/stages/${id}`);
    return response.data;
  },
};

export default apiClient;
