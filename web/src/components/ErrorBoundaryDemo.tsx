'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/hooks/useErrorBoundary';

/**
 * Composant de démonstration pour tester l'ErrorBoundary
 * À utiliser uniquement en développement pour tester la gestion d'erreurs
 */
export default function ErrorBoundaryDemo() {
  const [count, setCount] = useState(0);
  const { handleError, handleAsyncError } = useErrorHandler();

  // Erreur synchrone - sera capturée par l'ErrorBoundary
  const triggerSyncError = () => {
    throw new Error('Erreur synchrone de test - composant ErrorBoundaryDemo');
  };

  // Erreur asynchrone - utilise le hook pour déclencher l'ErrorBoundary
  const triggerAsyncError = async () => {
    await handleAsyncError(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler une opération async
        throw new Error('Erreur asynchrone de test - opération async échouée');
      },
      'ErrorBoundaryDemo async operation'
    );
  };

  // Erreur conditionnelle basée sur l'état
  const triggerConditionalError = () => {
    if (count > 3) {
      handleError('Erreur conditionnelle - compteur trop élevé', 'ErrorBoundaryDemo conditional');
    }
    setCount(count + 1);
  };

  // Erreur réseau simulée
  const triggerNetworkError = async () => {
    try {
      // Simuler un appel API qui échoue
      const response = await fetch('/api/nonexistent-endpoint');
      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      handleError(error as Error, 'ErrorBoundaryDemo network call');
    }
  };

  // Erreur de parsing JSON
  const triggerParsingError = () => {
    try {
      JSON.parse('{ invalid json }');
    } catch (error) {
      handleError(error as Error, 'ErrorBoundaryDemo JSON parsing');
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Ne pas afficher en production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-3">
        🧪 ErrorBoundary Demo
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        Composant de test pour l'ErrorBoundary (dev uniquement)
      </p>
      
      <div className="space-y-2">
        <Button
          onClick={triggerSyncError}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Erreur synchrone
        </Button>
        
        <Button
          onClick={triggerAsyncError}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Erreur asynchrone
        </Button>
        
        <Button
          onClick={triggerConditionalError}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Erreur conditionnelle ({count})
        </Button>
        
        <Button
          onClick={triggerNetworkError}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Erreur réseau
        </Button>
        
        <Button
          onClick={triggerParsingError}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Erreur parsing JSON
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Cliquez sur un bouton pour tester l'ErrorBoundary
      </p>
    </div>
  );
}
