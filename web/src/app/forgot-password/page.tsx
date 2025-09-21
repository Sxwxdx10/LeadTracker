'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { ResetPasswordRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ResetPasswordRequest>({
    email: '',
    organizationDomain: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    organizationDomain?: string;
  }>({});

  // Validation côté client
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    // Validation email
    if (!formData.email.trim()) {
      errors.email = 'L\'adresse email est requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Veuillez saisir une adresse email valide';
    }
    
    // Validation domaine organisation
    if (!formData.organizationDomain.trim()) {
      errors.organizationDomain = 'Le domaine de l\'organisation est requis';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(formData.organizationDomain)) {
      errors.organizationDomain = 'Veuillez saisir un domaine valide (ex: monentreprise.com)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setError(null);
    setFormErrors({});
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.requestPasswordReset(formData);
      setIsSuccess(true);
      toast.success('Instructions de réinitialisation envoyées !');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.errors?.[0]?.description ||
        'Une erreur est survenue lors de l\'envoi de la demande de réinitialisation';
      
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
                Email envoyé !
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nous avons envoyé les instructions de réinitialisation à :
              </p>
              <p className="mt-1 text-center text-sm font-medium text-gray-900">
                {formData.email}
              </p>
              <p className="mt-4 text-center text-sm text-gray-600">
                Vérifiez votre boîte email et suivez les instructions pour créer un nouveau mot de passe.
              </p>
              <p className="mt-2 text-center text-xs text-gray-500">
                Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier spam.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleBackToLogin}
                className="w-full"
              >
                Retour à la connexion
              </Button>
              
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({ email: '', organizationDomain: '' });
                  }}
                  className="text-sm text-brand-600 hover:text-brand-500"
                >
                  Envoyer à une autre adresse
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Formulaire de demande
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Mot de passe oublié
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Saisissez votre adresse email et le domaine de votre organisation pour recevoir les instructions de réinitialisation.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 ${formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="votre@email.com"
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="organizationDomain" className="block text-sm font-medium text-gray-700">
                  Domaine de l'organisation *
                </label>
                <Input
                  id="organizationDomain"
                  name="organizationDomain"
                  type="text"
                  required
                  value={formData.organizationDomain}
                  onChange={handleChange}
                  className={`mt-1 ${formErrors.organizationDomain ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="votre-entreprise.com"
                  disabled={isSubmitting}
                />
                {formErrors.organizationDomain && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.organizationDomain}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Le domaine de votre organisation (ex: monentreprise.com)
                </p>
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
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer les instructions'}
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
                href="/register"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                Créer un compte
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
