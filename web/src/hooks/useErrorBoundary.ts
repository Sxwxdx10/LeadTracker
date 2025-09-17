import { useCallback } from 'react';

/**
 * Hook pour déclencher manuellement l'ErrorBoundary
 * Utile pour gérer les erreurs asynchrones qui ne sont pas automatiquement capturées
 */
export function useErrorBoundary() {
  const throwError = useCallback((error: Error | string) => {
    const errorToThrow = typeof error === 'string' ? new Error(error) : error;
    
    // Déclencher l'erreur dans le prochain cycle de rendu
    // pour qu'elle soit capturée par l'ErrorBoundary
    setTimeout(() => {
      throw errorToThrow;
    }, 0);
  }, []);

  return { throwError };
}

/**
 * Hook pour gérer les erreurs dans les composants fonctionnels
 * Utilise l'ErrorBoundary parent pour afficher l'erreur
 */
export function useErrorHandler() {
  const { throwError } = useErrorBoundary();

  const handleError = useCallback((error: Error | string, context?: string) => {
    // Log l'erreur localement
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Déclencher l'ErrorBoundary
    throwError(error);
  }, [throwError]);

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError]);

  return { handleError, handleAsyncError };
}
