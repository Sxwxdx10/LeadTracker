'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [organizationDomain, setOrganizationDomain] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Vérification automatique au chargement de la page
  useEffect(() => {
    const verifyEmail = async () => {
      const emailParam = searchParams.get('email');
      const tokenParam = searchParams.get('token');
      
      if (!emailParam || !tokenParam) {
        setStatus('invalid');
        setError('Lien de vérification invalide. Paramètres manquants.');
        return;
      }

      const decodedEmail = decodeURIComponent(emailParam);
      const decodedToken = decodeURIComponent(tokenParam);
      
      setEmail(decodedEmail);

      try {
        await authApi.verifyEmail({
          email: decodedEmail,
          token: decodedToken,
        });
        
        setStatus('success');
        toast.success('Email vérifié avec succès !');
        
        // Démarrer le compte à rebours pour la redirection
        setRedirectCountdown(5);
      } catch (error: any) {
        console.error('Email verification error:', error);
        
        if (error.response?.status === 400) {
          setStatus('expired');
          setError('Le lien de vérification a expiré ou est invalide.');
        } else if (error.response?.status === 409) {
          setStatus('success'); // Email déjà vérifié
          toast('Email déjà vérifié !', { 
            icon: 'ℹ️',
            style: {
              borderColor: '#3b82f6',
              color: '#1e40af',
            },
          });
          setRedirectCountdown(3);
        } else {
          setStatus('error');
          const errorMessage = error.response?.data?.message || 
            error.response?.data?.errors?.[0]?.description ||
            'Une erreur est survenue lors de la vérification de l\'email.';
          setError(errorMessage);
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Gestion du compte à rebours pour la redirection
  useEffect(() => {
    if (redirectCountdown === null) return;

    if (redirectCountdown <= 0) {
      router.push('/login');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(redirectCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  // Fonction pour renvoyer l'email de vérification
  const handleResendVerification = async () => {
    if (!email || !organizationDomain.trim()) {
      toast.error('Veuillez saisir l\'identifiant de votre organisation');
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      await authApi.resendVerificationEmail({
        email,
        organizationDomain: organizationDomain.trim(),
      });
      
      toast.success('Email de vérification renvoyé !');
      setStatus('loading'); // Retour à l'état de chargement
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.errors?.[0]?.description ||
        'Erreur lors de l\'envoi de l\'email de vérification.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Affichage pendant le chargement
  if (status === 'loading') {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-100">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Vérification en cours...
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nous vérifions votre adresse email, veuillez patienter.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Affichage de succès avec redirection
  if (status === 'success') {
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
                Email vérifié !
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Votre adresse email <strong>{email}</strong> a été vérifiée avec succès.
              </p>
              {redirectCountdown !== null && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  Redirection automatique vers la page de connexion dans {redirectCountdown} seconde{redirectCountdown !== 1 ? 's' : ''}...
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Se connecter maintenant
              </Button>
              
              <div className="text-center">
                <Link
                  href="/leads"
                  className="text-sm text-brand-600 hover:text-brand-500"
                >
                  Aller au tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Affichage d'erreur avec option de renvoi
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
              {status === 'invalid' ? 'Lien invalide' : 
               status === 'expired' ? 'Lien expiré' : 'Erreur de vérification'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {error || 'Une erreur est survenue lors de la vérification de votre email.'}
            </p>
          </div>

          {/* Formulaire de renvoi d'email */}
          {(status === 'expired' || status === 'error') && (
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                  Renvoyer l'email de vérification
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Adresse email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 bg-gray-50"
                      placeholder="votre@email.com"
                      disabled={true}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Cette adresse email ne peut pas être modifiée
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="organizationDomain" className="block text-sm font-medium text-gray-700">
                      Identifiant de l'organisation *
                    </label>
                    <Input
                      id="organizationDomain"
                      name="organizationDomain"
                      type="text"
                      value={organizationDomain}
                      onChange={(e) => setOrganizationDomain(e.target.value)}
                      className="mt-1"
                      placeholder="demo-corp"
                      disabled={isResending}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      L'identifiant de votre organisation (ex: demo-corp)
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending || !organizationDomain.trim()}
                    className="w-full"
                  >
                    {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
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
              Créer un nouveau compte
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
