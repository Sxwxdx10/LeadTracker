'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest, RegisterWithInvitationRequest, InvitationValidationResponse } from '@/types/auth';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, registerWithInvitation, isAuthenticated, isLoading, error, clearError } = useAuth();
  
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationValidationResponse['invitation'] | null>(null);
  const [isValidatingInvitation, setIsValidatingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  
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

  // Détecter le token d'invitation dans l'URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setInvitationToken(token);
      validateInvitationToken(token);
    }
  }, [searchParams]);

  // Valider le token d'invitation
  const validateInvitationToken = async (token: string) => {
    setIsValidatingInvitation(true);
    setInvitationError(null);
    try {
      const response = await authApi.validateInvitationToken(token);
      if (response.valid && response.invitation) {
        setInvitationData(response.invitation);
        // Pré-remplir les champs avec les données de l'invitation
        setFormData(prev => ({
          ...prev,
          firstName: response.invitation!.firstName,
          lastName: response.invitation!.lastName,
          email: response.invitation!.email,
          organizationName: response.invitation!.organization.name,
          organizationDomain: response.invitation!.organization.domain,
        }));
      } else {
        setInvitationError(response.message || 'Ce lien d\'invitation est invalide ou a expiré.');
      }
    } catch (error: any) {
      setInvitationError('Erreur lors de la validation de l\'invitation. Veuillez réessayer.');
      console.error('Error validating invitation:', error);
    } finally {
      setIsValidatingInvitation(false);
    }
  };

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
      if (invitationToken && invitationData) {
        // Inscription via invitation
        const invitationRequest: RegisterWithInvitationRequest = {
          invitationToken,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        };
        await registerWithInvitation(invitationRequest);
      } else {
        // Inscription normale (création d'organisation)
        await register(formData);
      }
      router.push('/leads');
    } catch (error: any) {
      // L'erreur est gérée par le contexte d'authentification
      // Mais on peut aussi logger ici pour le débogage
      console.error('Registration error in form:', error);
      // Le message d'erreur sera affiché via le contexte (variable `error`)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Si c'est une invitation, ne pas permettre la modification des champs pré-remplis
    if (invitationData && (name === 'firstName' || name === 'lastName' || name === 'email' || 
        name === 'organizationName' || name === 'organizationDomain')) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Effacer l'erreur de mot de passe quand l'utilisateur tape
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  if (isLoading || isValidatingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  const isInvitationMode = !!(invitationToken && invitationData);

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isInvitationMode ? 'Accepter l\'invitation' : 'Créer un nouveau compte'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isInvitationMode ? (
                <>
                  Vous avez été invité à rejoindre <strong>{invitationData?.organization.name}</strong>
                </>
              ) : (
                <>
                  Ou{' '}
                  <Link
                    href="/login"
                    className="font-medium text-brand-600 hover:text-brand-500"
                  >
                    connectez-vous à votre compte existant
                  </Link>
                </>
              )}
            </p>
            
            {isInvitationMode && (
              <div className="mt-4 bg-brand-50 border border-brand-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-brand-400">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-brand-700">
                      <strong>Invitation reçue</strong> - Complétez votre inscription pour rejoindre l'organisation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {invitationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{invitationError}</p>
              <p className="text-sm text-red-600 mt-2">
                <Link href="/register" className="underline">
                  Créer un nouveau compte
                </Link>
              </p>
            </div>
          )}
          
          {!invitationError && (
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
                      disabled={isInvitationMode}
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
                      disabled={isInvitationMode}
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
                    disabled={isInvitationMode}
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
                {!isInvitationMode && (
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
                        Identifiant de l'organisation
                      </label>
                      <Input
                        id="organizationDomain"
                        name="organizationDomain"
                        type="text"
                        value={formData.organizationDomain}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="demo-corp"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Optionnel - L'identifiant de votre organisation (ex: demo-corp)
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
                )}

                {isInvitationMode && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Organisation</h3>
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-gray-700">
                        <strong>{invitationData?.organization.name}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Identifiant: {invitationData?.organization.domain}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(error || passwordError) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-600 font-medium">{error || passwordError}</p>
                      {error && error !== 'Erreur d\'inscription' && (
                        <p className="text-xs text-red-500 mt-1">
                          Si cette organisation existe déjà, veuillez contacter un administrateur pour recevoir une invitation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  loadingText={isInvitationMode ? "Finalisation de l'inscription..." : "Création du compte..."}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isInvitationMode ? 'Finaliser l\'inscription' : 'Créer le compte'}
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
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
