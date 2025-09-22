import { useState, useCallback } from 'react';

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialLoading = false, onSuccess, onError } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      onSuccess?.();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue');
      setError(error);
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    reset,
  };
}

// Hook spécialisé pour les boutons avec des états de chargement multiples
export function useButtonLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const executeWithLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    isLoading,
    setLoading,
    executeWithLoading,
    loadingStates,
  };
}

// Hook pour gérer les états de chargement avec timeout
export function useLoadingWithTimeout(timeout = 30000) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setHasTimedOut(false);
    
    const timer = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setHasTimedOut(false);
  }, []);

  return {
    isLoading,
    hasTimedOut,
    startLoading,
    stopLoading,
  };
}
