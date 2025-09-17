'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ErrorBoundaryDemo from '@/components/ErrorBoundaryDemo';
import { useErrorHandler } from '@/hooks/useErrorBoundary';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { handleError } = useErrorHandler();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    organizationDomain: '',
    rememberMe: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/leads');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      await login(formData);
      router.push('/leads');
    } catch (error) {
      // L'erreur est gérée par le contexte d'authentification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Connexion à votre compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ou{' '}
              <Link
                href="/register"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                créez un nouveau compte
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="votre@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Votre mot de passe"
                />
              </div>
              
              <div>
                <label htmlFor="organizationDomain" className="block text-sm font-medium text-gray-700">
                  Domaine de l'organisation
                </label>
                <Input
                  id="organizationDomain"
                  name="organizationDomain"
                  type="text"
                  required
                  value={formData.organizationDomain}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="votre-entreprise.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le domaine de votre organisation (ex: monentreprise.com)
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </Button>
            </div>

            <div className="text-center space-y-2">
              <Link
                href="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-500"
              >
                Mot de passe oublié ?
              </Link>
              
              {/* Bouton de test temporaire pour l'ErrorBoundary */}
              <div>
                <button
                  type="button"
                  onClick={() => handleError('Test ErrorBoundary - Ceci est une erreur de démonstration', 'LoginPage test')}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  🧪 Tester l'ErrorBoundary
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Composant de test pour l'ErrorBoundary - uniquement en développement */}
      <ErrorBoundaryDemo />
    </ProtectedRoute>
  );
}
