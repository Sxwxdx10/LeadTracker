'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour le state pour afficher l'UI d'erreur au prochain rendu
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur pour debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Met à jour le state avec les détails de l'erreur
    this.setState({
      error,
      errorInfo,
    });

    // Appeler le callback onError si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log l'erreur vers un service externe (en production)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // En développement, on log juste dans la console
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary - Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Stack:', error.stack);
      console.groupEnd();
      return;
    }

    // En production, on pourrait envoyer vers un service comme Sentry, LogRocket, etc.
    try {
      // Exemple d'envoi vers un service de logging
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getUserId(), // Si disponible
      };

      // Simuler l'envoi (à remplacer par votre service de logging)
      console.log('Would send error to logging service:', errorData);
      
      // Exemple avec fetch (à adapter selon votre service)
      /*
      fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch(err => {
        console.error('Failed to log error to service:', err);
      });
      */
    } catch (loggingError) {
      console.error('Error while logging to service:', loggingError);
    }
  };

  private getUserId = (): string | null => {
    // Récupérer l'ID utilisateur depuis le localStorage ou le contexte
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  private handleRetry = () => {
    // Réinitialiser l'état d'erreur
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    // Recharger complètement la page
    window.location.reload();
  };

  private copyErrorToClipboard = async () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorText = `
Error: ${this.state.error.message}

Stack Trace:
${this.state.error.stack}

Component Stack:
${this.state.errorInfo.componentStack}

URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      alert('Détails de l\'erreur copiés dans le presse-papiers');
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Détails de l\'erreur copiés dans le presse-papiers');
    }
  };

  override render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Afficher l'UI d'erreur par défaut
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            {/* Icône d'erreur */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Titre et description */}
            <div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oups ! Une erreur est survenue
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Une erreur inattendue s'est produite dans l'application. 
                Nos équipes ont été automatiquement notifiées.
              </p>
            </div>

            {/* Message d'erreur (en mode développement seulement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Détails de l'erreur (mode développement) :
                </h3>
                <p className="text-xs text-red-700 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                      Voir la stack trace
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="w-full sm:w-auto"
                >
                  Réessayer
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Recharger la page
                </Button>
              </div>

              {/* Actions supplémentaires */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
                <button
                  onClick={this.copyErrorToClipboard}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  Copier les détails de l'erreur
                </button>
                <span className="hidden sm:inline text-gray-300">•</span>
                <a
                  href="/"
                  className="text-brand-600 hover:text-brand-500 underline"
                >
                  Retour à l'accueil
                </a>
              </div>
            </div>

            {/* Conseils utilisateur */}
            <div className="bg-brand-50 border border-brand-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-brand-800 mb-2">
                Que pouvez-vous faire ?
              </h3>
              <ul className="text-xs text-brand-700 space-y-1 text-left">
                <li>• Cliquez sur "Réessayer" pour tenter de continuer</li>
                <li>• Rechargez la page si le problème persiste</li>
                <li>• Vérifiez votre connexion internet</li>
                <li>• Contactez le support si l'erreur se reproduit</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Si pas d'erreur, afficher les enfants normalement
    return this.props.children;
  }
}

export default ErrorBoundary;
