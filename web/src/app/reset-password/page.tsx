'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/auth';
import { ConfirmResetPasswordRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<ConfirmResetPasswordRequest>({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Extraire les paramètres de l'URL au chargement
  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    
    if (!email || !token) {
      setTokenError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      email: decodeURIComponent(email),
      token: decodeURIComponent(token),
    }));
  }, [searchParams]);

  // Validation de la force du mot de passe
  const validatePasswordStrength = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Au moins un caractère spécial');
    }
    
    return errors;
  };

  // Validation côté client
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    // Validation email
    if (!formData.email.trim()) {
      errors.email = 'L\'adresse email est requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Veuillez saisir une adresse email valide';
    }
    
    // Validation nouveau mot de passe
    if (!formData.newPassword.trim()) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else {
      const strengthErrors = validatePasswordStrength(formData.newPassword);
      if (strengthErrors.length > 0) {
        errors.newPassword = `Mot de passe trop faible: ${strengthErrors.join(', ')}`;
      }
    }
    
    // Validation confirmation mot de passe
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si le token est valide
    if (tokenError) {
      return;
    }
    
    // Réinitialiser les erreurs
    setError(null);
    setFormErrors({});
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.confirmPasswordReset(formData);
      setIsSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès !');
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue lors de la réinitialisation du mot de passe';
      
      if (error.response?.status === 400) {
        errorMessage = 'Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors?.[0]?.description) {
        errorMessage = error.response.data.errors[0].description;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Nettoyer l'erreur du champ quand l'utilisateur commence à taper
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  // Affichage d'erreur de token
  if (tokenError) {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Lien invalide
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {tokenError}
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/forgot-password"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Demander un nouveau lien
              </Link>
              
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-brand-600 hover:text-brand-500"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Affichage de succès
  if (isSuccess) {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Mot de passe réinitialisé !
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <p className="mt-1 text-center text-sm text-gray-600">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleBackToLogin}
                className="w-full"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Formulaire de réinitialisation
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Nouveau mot de passe
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
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
                  className={`mt-1 bg-gray-50 ${formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="votre@email.com"
                  disabled={true}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Cette adresse email ne peut pas être modifiée
                </p>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe *
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`mt-1 ${formErrors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Votre nouveau mot de passe"
                  disabled={isSubmitting}
                />
                {formErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  <p>Le mot de passe doit contenir :</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Au moins 8 caractères</li>
                    <li>Une majuscule et une minuscule</li>
                    <li>Un chiffre et un caractère spécial</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le nouveau mot de passe *
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`mt-1 ${formErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Répétez votre nouveau mot de passe"
                  disabled={isSubmitting}
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-4 text-sm">
              <Link
                href="/login"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                Retour à la connexion
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/forgot-password"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                Nouveau lien de réinitialisation
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
