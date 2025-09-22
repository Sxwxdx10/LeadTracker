'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  KeyIcon,
  BellIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  leadAssignments: boolean;
  taskReminders: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, organization, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // États pour l'édition
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // États de chargement
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // Données du formulaire
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
  });
  
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    leadAssignments: true,
    taskReminders: true,
    weeklyReports: false,
    systemUpdates: true,
  });
  
  // Messages d'erreur
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Initialiser les données du profil
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
      });
    }
  }, [user]);

  // Gestion des changements de formulaire
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setProfileError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const handleNotificationChange = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  // Validation du mot de passe
  const validatePassword = (): boolean => {
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    if (!passwordData.currentPassword) {
      setPasswordError('Veuillez saisir votre mot de passe actuel');
      return false;
    }
    
    return true;
  };

  // Soumission du profil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    setProfileError('');

    try {
      // TODO: Intégrer avec l'API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation
      console.log('Profil mis à jour:', profileData);
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Soumission du changement de mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setIsLoadingPassword(true);
    setPasswordError('');

    try {
      // TODO: Intégrer avec l'API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation
      console.log('Mot de passe changé');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } catch (error) {
      setPasswordError('Erreur lors du changement de mot de passe');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  // Sauvegarde des paramètres de notification
  const handleNotificationsSave = async () => {
    setIsLoadingNotifications(true);

    try {
      // TODO: Intégrer avec l'API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      console.log('Paramètres de notification sauvegardés:', notificationSettings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Redirection si pas connecté
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Utilisateur non trouvé</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 text-brand-600 hover:text-brand-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-sm text-gray-600">
                  Gérez vos informations personnelles et paramètres
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Retour
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Informations utilisateur */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 bg-brand-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-brand-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                {user.jobTitle && (
                  <p className="text-sm text-gray-500">{user.jobTitle}</p>
                )}
                {organization && (
                  <div className="flex items-center mt-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">{organization.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Onglets */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Informations personnelles</TabsTrigger>
              <TabsTrigger value="password">Mot de passe</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* Onglet Profil */}
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Informations personnelles
                  </h3>
                  {!isEditingProfile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Modifier
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileError('');
                          // Reset des données
                          if (user) {
                            setProfileData({
                              firstName: user.firstName || '',
                              lastName: user.lastName || '',
                              email: user.email || '',
                              jobTitle: user.jobTitle || '',
                            });
                          }
                        }}
                        disabled={isLoadingProfile}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleProfileSubmit}
                        disabled={isLoadingProfile}
                      >
                        {isLoadingProfile ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prénom
                        </label>
                        <Input
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          placeholder="Votre prénom"
                          disabled={isLoadingProfile}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom
                        </label>
                        <Input
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          placeholder="Votre nom"
                          disabled={isLoadingProfile}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="votre@email.com"
                        disabled={isLoadingProfile}
                      />
                    </div>
                    
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poste
                      </label>
                      <Input
                        name="jobTitle"
                        value={profileData.jobTitle}
                        onChange={handleProfileChange}
                        placeholder="Votre poste"
                        disabled={isLoadingProfile}
                      />
                    </div>

                    {profileError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-600">{profileError}</p>
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Nom complet</p>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{user.email}</p>
                        </div>
                      </div>
                      
                      
                      {user.jobTitle && (
                        <div className="flex items-center space-x-3">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Poste</p>
                            <p className="font-medium text-gray-900">{user.jobTitle}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Mot de passe */}
            <TabsContent value="password" className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Changer le mot de passe
                  </h3>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <KeyIcon className="h-3 w-3" />
                    Sécurisé
                  </Badge>
                </div>

                {!isChangingPassword ? (
                  <div className="text-center py-8">
                    <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                      Mot de passe sécurisé
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Votre mot de passe est protégé. Cliquez pour le modifier.
                    </p>
                    <div className="mt-6">
                      <Button
                        onClick={() => setIsChangingPassword(true)}
                        variant="outline"
                      >
                        Changer le mot de passe
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe actuel
                      </label>
                      <div className="relative">
                        <Input
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Votre mot de passe actuel"
                          disabled={isLoadingPassword}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Input
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Minimum 8 caractères"
                          disabled={isLoadingPassword}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Répétez le nouveau mot de passe"
                          disabled={isLoadingPassword}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-600">{passwordError}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordError('');
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                        }}
                        disabled={isLoadingPassword}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoadingPassword}
                      >
                        {isLoadingPassword ? 'Chargement...' : 'Changer le mot de passe'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </TabsContent>

            {/* Onglet Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Paramètres de notification
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNotificationsSave}
                    disabled={isLoadingNotifications}
                    className="flex items-center gap-2"
                  >
                    {isLoadingNotifications ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    {isLoadingNotifications ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Notifications générales */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      Notifications générales
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Notifications par email
                            </p>
                            <p className="text-xs text-gray-500">
                              Recevoir des notifications par email
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={() => handleNotificationChange('emailNotifications')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <BellIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Notifications push
                            </p>
                            <p className="text-xs text-gray-500">
                              Notifications dans le navigateur
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.pushNotifications}
                            onChange={() => handleNotificationChange('pushNotifications')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notifications spécifiques */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      Notifications spécifiques
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Attribution de leads
                          </p>
                          <p className="text-xs text-gray-500">
                            Quand un lead vous est assigné
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.leadAssignments}
                            onChange={() => handleNotificationChange('leadAssignments')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Rappels de tâches
                          </p>
                          <p className="text-xs text-gray-500">
                            Rappels pour vos tâches à venir
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.taskReminders}
                            onChange={() => handleNotificationChange('taskReminders')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Rapports hebdomadaires
                          </p>
                          <p className="text-xs text-gray-500">
                            Résumé hebdomadaire de vos activités
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.weeklyReports}
                            onChange={() => handleNotificationChange('weeklyReports')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Mises à jour système
                          </p>
                          <p className="text-xs text-gray-500">
                            Notifications sur les nouvelles fonctionnalités
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.systemUpdates}
                            onChange={() => handleNotificationChange('systemUpdates')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
