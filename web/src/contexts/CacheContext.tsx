'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CacheStats, cacheUtils } from '@/hooks/useCache';

interface CacheContextType {
  stats: CacheStats;
  clearCache: () => void;
  invalidateByTag: (tag: string) => number;
  invalidateByDependency: (dependency: string) => number;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function useCacheContext() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext must be used within a CacheProvider');
  }
  return context;
}

interface CacheProviderProps {
  children: React.ReactNode;
}

export function CacheProvider({ children }: CacheProviderProps) {
  const [stats, setStats] = useState<CacheStats>(cacheUtils.getStats());
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Mise à jour des statistiques
  useEffect(() => {
    const updateStats = () => {
      setStats(cacheUtils.getStats());
    };

    // Mise à jour initiale
    updateStats();

    // Mise à jour périodique
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, []);

  // Gestion de la connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('idle');
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronisation automatique quand on revient en ligne
  useEffect(() => {
    if (isOnline && syncStatus === 'idle') {
      setSyncStatus('syncing');
      
      // Simuler une synchronisation
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    }
  }, [isOnline, syncStatus]);

  const clearCache = () => {
    cacheUtils.clear();
    setStats(cacheUtils.getStats());
  };

  const invalidateByTag = (tag: string) => {
    const count = cacheUtils.invalidateByTag(tag);
    setStats(cacheUtils.getStats());
    return count;
  };

  const invalidateByDependency = (dependency: string) => {
    const count = cacheUtils.invalidateByDependency(dependency);
    setStats(cacheUtils.getStats());
    return count;
  };

  const value: CacheContextType = {
    stats,
    clearCache,
    invalidateByTag,
    invalidateByDependency,
    isOnline,
    syncStatus,
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

