'use client';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheUtils, CacheOptions } from '@/hooks/useCache';

// Configuration des tags de cache
export const CACHE_TAGS = {
  LEADS: 'leads',
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  TASKS: 'tasks',
} as const;

// Configuration des dépendances de cache
export const CACHE_DEPENDENCIES = {
  USER_AUTH: 'user_auth',
  ORGANIZATION_DATA: 'organization_data',
  LEAD_STATUS: 'lead_status',
} as const;

// Configuration par défaut du cache
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  tags: [],
  dependencies: [],
};

// Interface pour les options de requête avec cache
export interface CachedRequestOptions extends AxiosRequestConfig {
  cache?: {
    key: string;
    ttl?: number;
    tags?: string[];
    dependencies?: string[];
    forceRefresh?: boolean;
  };
}

// Classe pour les requêtes API avec cache
class CachedApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Méthode générique pour les requêtes GET avec cache
  async get<T = any>(
    url: string, 
    options: CachedRequestOptions = {}
  ): Promise<T> {
    const cacheKey = options.cache?.key || `GET:${url}`;
    const cacheOptions: CacheOptions = {
      ttl: options.cache?.ttl || DEFAULT_CACHE_OPTIONS.ttl,
      tags: options.cache?.tags || [],
      dependencies: options.cache?.dependencies || [],
      forceRefresh: options.cache?.forceRefresh || false,
    };

    // Vérifier le cache si pas de force refresh
    if (!cacheOptions.forceRefresh) {
      const cached = cacheUtils.get<T>(cacheKey);
      if (cached) {
        console.log(`[Cache] Hit for ${cacheKey}`);
        return cached.data;
      }
    }

    console.log(`[Cache] Miss for ${cacheKey}, fetching from API`);

    try {
      const response: AxiosResponse<T> = await axios.get(
        `${this.baseURL}${url}`,
        {
          ...options,
          headers: { ...this.defaultHeaders, ...options.headers },
        }
      );

      // Mettre en cache la réponse
      cacheUtils.set(cacheKey, response.data, cacheOptions);
      
      return response.data;
    } catch (error) {
      console.error(`[Cache] API Error for ${cacheKey}:`, error);
      
      // En cas d'erreur, essayer de retourner les données du cache
      const cached = cacheUtils.get<T>(cacheKey);
      if (cached) {
        console.log(`[Cache] Fallback to cached data for ${cacheKey}`);
        return cached.data;
      }
      
      throw error;
    }
  }

  // Méthode pour les requêtes POST avec invalidation de cache
  async post<T = any>(
    url: string,
    data: any,
    options: CachedRequestOptions = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.post(
        `${this.baseURL}${url}`,
        data,
        {
          ...options,
          headers: { ...this.defaultHeaders, ...options.headers },
        }
      );

      // Invalider les caches liés
      if (options.cache?.tags) {
        options.cache.tags.forEach(tag => cacheUtils.invalidateByTag(tag));
      }

      if (options.cache?.dependencies) {
        options.cache.dependencies.forEach(dep => 
          cacheUtils.invalidateByDependency(dep)
        );
      }

      return response.data;
    } catch (error) {
      console.error(`[Cache] POST Error for ${url}:`, error);
      throw error;
    }
  }

  // Méthode pour les requêtes PUT avec invalidation de cache
  async put<T = any>(
    url: string,
    data: any,
    options: CachedRequestOptions = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.put(
        `${this.baseURL}${url}`,
        data,
        {
          ...options,
          headers: { ...this.defaultHeaders, ...options.headers },
        }
      );

      // Invalider les caches liés
      if (options.cache?.tags) {
        options.cache.tags.forEach(tag => cacheUtils.invalidateByTag(tag));
      }

      if (options.cache?.dependencies) {
        options.cache.dependencies.forEach(dep => 
          cacheUtils.invalidateByDependency(dep)
        );
      }

      return response.data;
    } catch (error) {
      console.error(`[Cache] PUT Error for ${url}:`, error);
      throw error;
    }
  }

  // Méthode pour les requêtes DELETE avec invalidation de cache
  async delete<T = any>(
    url: string,
    options: CachedRequestOptions = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.delete(
        `${this.baseURL}${url}`,
        {
          ...options,
          headers: { ...this.defaultHeaders, ...options.headers },
        }
      );

      // Invalider les caches liés
      if (options.cache?.tags) {
        options.cache.tags.forEach(tag => cacheUtils.invalidateByTag(tag));
      }

      if (options.cache?.dependencies) {
        options.cache.dependencies.forEach(dep => 
          cacheUtils.invalidateByDependency(dep)
        );
      }

      return response.data;
    } catch (error) {
      console.error(`[Cache] DELETE Error for ${url}:`, error);
      throw error;
    }
  }
}

// Instance globale de l'API client
export const cachedApi = new CachedApiClient();

// Hooks spécialisés pour les différentes entités
export const useLeadsApi = () => {
  const getLeads = (options: CachedRequestOptions = {}) =>
    cachedApi.get('/api/leads', {
      ...options,
      cache: {
        key: 'leads:list',
        ttl: 2 * 60 * 1000, // 2 minutes
        tags: [CACHE_TAGS.LEADS],
        ...options.cache,
      },
    });

  const getLead = (id: string, options: CachedRequestOptions = {}) =>
    cachedApi.get(`/api/leads/${id}`, {
      ...options,
      cache: {
        key: `leads:${id}`,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: [CACHE_TAGS.LEADS],
        ...options.cache,
      },
    });

  const createLead = (data: any, options: CachedRequestOptions = {}) =>
    cachedApi.post('/api/leads', data, {
      ...options,
      cache: {
        tags: [CACHE_TAGS.LEADS],
        ...options.cache,
      },
    });

  const updateLead = (id: string, data: any, options: CachedRequestOptions = {}) =>
    cachedApi.put(`/api/leads/${id}`, data, {
      ...options,
      cache: {
        tags: [CACHE_TAGS.LEADS],
        ...options.cache,
      },
    });

  const deleteLead = (id: string, options: CachedRequestOptions = {}) =>
    cachedApi.delete(`/api/leads/${id}`, {
      ...options,
      cache: {
        tags: [CACHE_TAGS.LEADS],
        ...options.cache,
      },
    });

  return {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
  };
};

export const useAnalyticsApi = () => {
  const getAnalytics = (options: CachedRequestOptions = {}) =>
    cachedApi.get('/api/analytics', {
      ...options,
      cache: {
        key: 'analytics:overview',
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: [CACHE_TAGS.ANALYTICS],
        ...options.cache,
      },
    });

  const getReports = (options: CachedRequestOptions = {}) =>
    cachedApi.get('/api/reports', {
      ...options,
      cache: {
        key: 'reports:overview',
        ttl: 15 * 60 * 1000, // 15 minutes
        tags: [CACHE_TAGS.REPORTS],
        ...options.cache,
      },
    });

  return {
    getAnalytics,
    getReports,
  };
};

export const useTasksApi = () => {
  const getTasks = (options: CachedRequestOptions = {}) =>
    cachedApi.get('/api/tasks', {
      ...options,
      cache: {
        key: 'tasks:list',
        ttl: 1 * 60 * 1000, // 1 minute
        tags: [CACHE_TAGS.TASKS],
        ...options.cache,
      },
    });

  const getTask = (id: string, options: CachedRequestOptions = {}) =>
    cachedApi.get(`/api/tasks/${id}`, {
      ...options,
      cache: {
        key: `tasks:${id}`,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: [CACHE_TAGS.TASKS],
        ...options.cache,
      },
    });

  const createTask = (data: any, options: CachedRequestOptions = {}) =>
    cachedApi.post('/api/tasks', data, {
      ...options,
      cache: {
        tags: [CACHE_TAGS.TASKS],
        ...options.cache,
      },
    });

  const updateTask = (id: string, data: any, options: CachedRequestOptions = {}) =>
    cachedApi.put(`/api/tasks/${id}`, data, {
      ...options,
      cache: {
        tags: [CACHE_TAGS.TASKS],
        ...options.cache,
      },
    });

  const deleteTask = (id: string, options: CachedRequestOptions = {}) =>
    cachedApi.delete(`/api/tasks/${id}`, {
      ...options,
      cache: {
        tags: [CACHE_TAGS.TASKS],
        ...options.cache,
      },
    });

  return {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
  };
};

// Utilitaires d'invalidation de cache
export const cacheInvalidation = {
  // Invalider tous les caches liés aux leads
  invalidateLeads: () => cacheUtils.invalidateByTag(CACHE_TAGS.LEADS),
  
  // Invalider tous les caches liés aux analytics
  invalidateAnalytics: () => cacheUtils.invalidateByTag(CACHE_TAGS.ANALYTICS),
  
  // Invalider tous les caches liés aux rapports
  invalidateReports: () => cacheUtils.invalidateByTag(CACHE_TAGS.REPORTS),
  
  // Invalider tous les caches liés aux tâches
  invalidateTasks: () => cacheUtils.invalidateByTag(CACHE_TAGS.TASKS),
  
  // Invalider tous les caches liés à l'authentification
  invalidateAuth: () => cacheUtils.invalidateByDependency(CACHE_DEPENDENCIES.USER_AUTH),
  
  // Invalider tous les caches
  invalidateAll: () => cacheUtils.clear(),
};

export default cachedApi;

