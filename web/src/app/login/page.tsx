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

  // Ne pas bloquer l'affichage si le chargement prend trop de temps
  // Afficher le formulaire même pendant le chargement initial
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Afficher le formulaire après un court délai même si isLoading est true
    const timer = setTimeout(() => {
      setShowForm(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Si le chargement prend trop de temps, afficher quand même le formulaire
  if (isLoading && !showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header simple pour la page de connexion */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Retour à la page d'accueil"
            >
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Lead Tracker</span>
            </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                    Identifiant de l'organisation
                  </label>
                  <Input
                    id="organizationDomain"
                    name="organizationDomain"
                    type="text"
                    required
                    value={formData.organizationDomain}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="demo-corp"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    L'identifiant de votre organisation (ex: demo-corp)
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
                  loading={isSubmitting}
                  loadingText="Connexion..."
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Se connecter
                </Button>
              </div>

              <div className="text-center space-y-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-600 hover:text-brand-500"
                >
                  Mot de passe oublié ?
                </Link>
                
                {/* Bouton de test temporaire pour l'ErrorBoundary - DÉSACTIVÉ */}
                {/* 
                <div>
                  <button
                    type="button"
                    onClick={() => handleError('Test ErrorBoundary - Ceci est une erreur de démonstration', 'LoginPage test')}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    🧪 Tester l'ErrorBoundary
                  </button>
                </div>
                */}
              </div>
            </form>
          </div>
        </div>
        
        {/* Composant de test pour l'ErrorBoundary - uniquement en développement */}
        <ErrorBoundaryDemo />
      </div>
    </ProtectedRoute>
  );
}
