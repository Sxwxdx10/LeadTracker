'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationDescription: '',
    organizationDomain: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
    setPasswordError('');

    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      setIsSubmitting(false);
      return;
    }

    try {
      await register(formData);
      router.push('/leads');
    } catch (error) {
      // L'erreur est gérée par le contexte d'authentification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Effacer l'erreur de mot de passe quand l'utilisateur tape
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
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
              Créer un nouveau compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ou{' '}
              <Link
                href="/login"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                connectez-vous à votre compte existant
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Prénom
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Jean"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Dupont"
                  />
                </div>
              </div>
              
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
                  placeholder="jean.dupont@email.com"
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Minimum 8 caractères"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Répétez votre mot de passe"
                />
              </div>

              {/* Informations de l'organisation */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Informations de l'organisation</h3>
                
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                    Nom de l'organisation
                  </label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Mon Entreprise"
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
                    value={formData.organizationDomain}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="monentreprise.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optionnel - Le domaine de votre organisation
                  </p>
                </div>
                
                <div>
                  <label htmlFor="organizationDescription" className="block text-sm font-medium text-gray-700">
                    Description de l'organisation
                  </label>
                  <textarea
                    id="organizationDescription"
                    name="organizationDescription"
                    rows={3}
                    value={formData.organizationDescription}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Décrivez brièvement votre organisation..."
                  />
                </div>
              </div>
            </div>

            {(error || passwordError) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error || passwordError}</p>
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Création du compte...' : 'Créer le compte'}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                En créant un compte, vous acceptez nos{' '}
                <Link href="/terms" className="text-brand-600 hover:text-brand-500">
                  conditions d'utilisation
                </Link>{' '}
                et notre{' '}
                <Link href="/privacy" className="text-brand-600 hover:text-brand-500">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
