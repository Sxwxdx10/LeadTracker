'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Types pour le cache
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live en millisecondes
  tags?: string[];
  dependencies?: string[];
  version: number;
}

export interface CacheConfig {
  ttl?: number; // TTL par défaut en millisecondes
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
  maxSize?: number; // Taille maximale du cache
  enableLogging?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  dependencies?: string[];
  forceRefresh?: boolean;
  optimistic?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

// Classe de gestion du cache
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private config: Required<CacheConfig>;
  private listeners = new Set<(key: string, entry: CacheEntry | null) => void>();

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes par défaut
      storage: config.storage || 'localStorage',
      maxSize: config.maxSize || 100,
      enableLogging: config.enableLogging || false,
    };

    this.loadFromStorage();
    this.startCleanupInterval();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.config.storage === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      
      const stored = storage.getItem('leadtracker_cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
        this.log('Cache loaded from storage', { size: this.cache.size });
      }
    } catch (error) {
      this.log('Error loading cache from storage', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.config.storage === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      
      const data = Array.from(this.cache.entries());
      storage.setItem('leadtracker_cache', JSON.stringify(data));
      this.log('Cache saved to storage', { size: this.cache.size });
    } catch (error) {
      this.log('Error saving cache to storage', error);
    }
  }

  private startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Nettoyage toutes les minutes
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
        this.notifyListeners(key, null);
      }
    }

    // Nettoyage par taille si nécessaire
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        cleaned++;
        this.notifyListeners(key, null);
      });
    }

    if (cleaned > 0) {
      this.saveToStorage();
      this.log(`Cache cleanup: removed ${cleaned} entries`);
    }
  }

  private log(message: string, data?: any) {
    if (this.config.enableLogging) {
      console.log(`[CacheManager] ${message}`, data);
    }
  }

  private notifyListeners(key: string, entry: CacheEntry | null) {
    this.listeners.forEach(listener => listener(key, entry));
  }

  // Méthodes publiques
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.notifyListeners(key, null);
      return null;
    }

    this.stats.hits++;
    return entry as CacheEntry<T>;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: options.ttl || this.config.ttl,
      ...(options.tags && { tags: options.tags }),
      ...(options.dependencies && { dependencies: options.dependencies }),
      version: 1,
    };

    this.cache.set(key, entry);
    this.saveToStorage();
    this.notifyListeners(key, entry);
    this.log(`Cache set: ${key}`, { ttl: entry.ttl, tags: entry.tags });
  }

  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToStorage();
      this.notifyListeners(key, null);
      this.log(`Cache invalidated: ${key}`);
    }
    return deleted;
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        this.notifyListeners(key, null);
        count++;
      }
    }
    
    if (count > 0) {
      this.saveToStorage();
      this.log(`Cache invalidated by tag: ${tag}`, { count });
    }
    
    return count;
  }

  invalidateByDependency(dependency: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        this.cache.delete(key);
        this.notifyListeners(key, null);
        count++;
      }
    }
    
    if (count > 0) {
      this.saveToStorage();
      this.log(`Cache invalidated by dependency: ${dependency}`, { count });
    }
    
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
    this.log('Cache cleared');
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      oldestEntry: timestamps.length ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length ? Math.max(...timestamps) : 0,
    };
  }

  subscribe(listener: (key: string, entry: CacheEntry | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Instance globale du cache
const cacheManager = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  storage: 'localStorage',
  maxSize: 100,
  enableLogging: process.env.NODE_ENV === 'development',
});

// Hook principal useCache
export function useCache<T = any>(
  key: string,
  fetcher?: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const fetcherRef = useRef(fetcher);

  // Mise à jour du fetcher
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Fonction de récupération des données
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!fetcherRef.current) return;

    // Vérifier le cache si pas de force refresh
    if (!forceRefresh) {
      const cached = cacheManager.get<T>(key);
      if (cached) {
        setData(cached.data);
        setIsStale(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      
      // Mettre en cache le résultat
      cacheManager.set(key, result, options);
      setData(result);
      setIsStale(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // En cas d'erreur, essayer de récupérer les données du cache
      const cached = cacheManager.get<T>(key);
      if (cached) {
        setData(cached.data);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, [key, options]);

  // Chargement initial
  useEffect(() => {
    fetchData(options.forceRefresh);
  }, [fetchData, options.forceRefresh]);

  // Écoute des changements du cache
  useEffect(() => {
    const unsubscribe = cacheManager.subscribe((cacheKey, entry) => {
      if (cacheKey === key) {
        if (entry) {
          setData(entry.data);
          setIsStale(false);
        } else {
          setData(null);
        }
      }
    });

    return unsubscribe;
  }, [key]);

  // Fonctions utilitaires
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cacheManager.invalidate(key);
  }, [key]);

  const mutate = useCallback((newData: T, options: CacheOptions = {}) => {
    cacheManager.set(key, newData, options);
  }, [key]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate,
    mutate,
  };
}

// Hook pour les requêtes avec cache automatique
export function useCachedQuery<T = any>(
  queryKey: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  return useCache<T>(queryKey, fetcher, options);
}

// Hook pour la mutation avec invalidation
export function useCachedMutation<T = any>(
  mutationFn: (data: any) => Promise<T>,
  options: {
    invalidateKeys?: string[];
    invalidateTags?: string[];
    invalidateDependencies?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(data);
      
      // Invalider les caches spécifiés
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => cacheManager.invalidate(key));
      }
      
      if (options.invalidateTags) {
        options.invalidateTags.forEach(tag => cacheManager.invalidateByTag(tag));
      }
      
      if (options.invalidateDependencies) {
        options.invalidateDependencies.forEach(dep => 
          cacheManager.invalidateByDependency(dep)
        );
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error,
  };
}

// Hook pour les statistiques du cache
export function useCacheStats() {
  const [stats, setStats] = useState<CacheStats>(cacheManager.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(cacheManager.getStats());
    };

    // Mise à jour des stats toutes les 30 secondes
    const interval = setInterval(updateStats, 30000);
    
    // Écoute des changements du cache
    const unsubscribe = cacheManager.subscribe(() => {
      updateStats();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const clearCache = useCallback(() => {
    cacheManager.clear();
    setStats(cacheManager.getStats());
  }, []);

  return {
    stats,
    clearCache,
  };
}

// Utilitaires d'export
export const cacheUtils = {
  get: <T>(key: string) => cacheManager.get<T>(key),
  set: <T>(key: string, data: T, options?: CacheOptions) => 
    cacheManager.set(key, data, options),
  invalidate: (key: string) => cacheManager.invalidate(key),
  invalidateByTag: (tag: string) => cacheManager.invalidateByTag(tag),
  invalidateByDependency: (dependency: string) => 
    cacheManager.invalidateByDependency(dependency),
  clear: () => cacheManager.clear(),
  getStats: () => cacheManager.getStats(),
};

export default useCache;

