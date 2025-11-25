'use client';

import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/users-api';
import { UserInvitation, InviteUserDto, USER_ROLES, ROLE_DISPLAY_NAMES } from '@/types/user';
import { 
  Building2, 
  Globe, 
  CreditCard, 
  Plug, 
  Settings,
  Save,
  Upload,
  Check,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Palette,
  Shield,
  Users,
  UserPlus,
  X,
  RefreshCw,
  Copy,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'domain' | 'billing' | 'integrations' | 'members'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const { organization, isLoading, error, fetchOrganization, updateOrganization, uploadLogo } = useOrganization();
  const { user } = useAuth();
  const toast = useToast();
  
  // Invitations state
  const [pendingInvitations, setPendingInvitations] = useState<UserInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [invitationForm, setInvitationForm] = useState<InviteUserDto>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    role: USER_ROLES.VIEWER,
    message: ''
  });

  // Members state
  const [members, setMembers] = useState<User[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    timeZone: '',
    currency: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    primaryColor: '',
    secondaryColor: ''
  });

  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('Admin') || false;
  const canEditOrganization = isAdmin;

  // Load organization data on mount (only once)
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchOrganization();
    }
    return () => {
      isMounted = false;
    };
  }, []); // Remove fetchOrganization from dependencies to avoid infinite loops

  // Load pending invitations and members when members tab is active
  useEffect(() => {
    if (activeTab === 'members' && isAdmin) {
      loadPendingInvitations();
      loadMembers();
    }
  }, [activeTab, isAdmin]);

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await usersApi.getUsers({ page: 1, pageSize: 100 });
      setMembers(response.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des membres');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const invitations = await usersApi.getPendingInvitations();
      setPendingInvitations(invitations);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des invitations');
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!invitationForm.email || !invitationForm.firstName || !invitationForm.lastName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsSendingInvitation(true);
      const response = await usersApi.inviteUser(invitationForm);
      
      if (response.success) {
        toast.success(response.message || 'Invitation envoyée avec succès');
        setInvitationForm({
          firstName: '',
          lastName: '',
          email: '',
          jobTitle: '',
          role: USER_ROLES.VIEWER,
          message: ''
        });
        await loadPendingInvitations();
      } else {
        toast.error(response.message || 'Erreur lors de l\'envoi de l\'invitation');
      }
    } catch (err: any) {
      // Extraire le message d'erreur le plus détaillé possible
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Erreur lors de l\'envoi de l\'invitation';
      console.error('Erreur lors de l\'envoi de l\'invitation:', err);
      toast.error(errorMessage);
    } finally {
      setIsSendingInvitation(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      return;
    }

    try {
      await usersApi.cancelInvitation(invitationId);
      toast.success('Invitation annulée avec succès');
      await loadPendingInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'annulation de l\'invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await usersApi.resendInvitation(invitationId);
      toast.success('Invitation renvoyée avec succès');
      await loadPendingInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du renvoi de l\'invitation');
    }
  };

  const getInvitationUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${baseUrl}/register?token=${token}`;
  };

  const handleCopyInvitationUrl = (token: string) => {
    const url = getInvitationUrl(token);
    navigator.clipboard.writeText(url);
    toast.success('Lien d\'invitation copié dans le presse-papiers');
  };

  // Populate form when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        website: organization.website || '',
        timeZone: organization.timeZone || 'UTC',
        currency: organization.currency || 'USD',
        address: organization.address || {
          street: organization.addressStreet || '',
          city: organization.addressCity || '',
          state: organization.addressState || '',
          postalCode: organization.addressPostalCode || '',
          country: organization.addressCountry || ''
        },
        primaryColor: organization.primaryColor || '',
        secondaryColor: organization.secondaryColor || ''
      });
    }
  }, [organization]);

  const billingSettings = {
    plan: {
      name: 'Professional',
      price: 79,
      currency: 'USD',
      interval: 'monthly',
      features: [
        'Leads illimités',
        '10 utilisateurs',
        'Support prioritaire',
        'Toutes les intégrations'
      ]
    },
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const integrations = [
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Synchronisation des leads avec Mailchimp',
      status: 'active',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];

  const tabs = [
    { id: 'info', label: 'Informations', icon: Building2 },
    { id: 'domain', label: 'Domaine', icon: Globe },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'integrations', label: 'Intégrations', icon: Plug },
    { id: 'members', label: 'Membres', icon: Users, adminOnly: true }
  ];

  const handleEdit = () => {
    if (!canEditOrganization) {
      toast.error('Seuls les administrateurs peuvent modifier ces paramètres');
      return;
    }
    setIsEditing(true);
  };
  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        website: organization.website || '',
        timeZone: organization.timeZone || 'UTC',
        currency: organization.currency || 'USD',
        address: organization.address || {
          street: organization.addressStreet || '',
          city: organization.addressCity || '',
          state: organization.addressState || '',
          postalCode: organization.addressPostalCode || '',
          country: organization.addressCountry || ''
        },
        primaryColor: organization.primaryColor || '',
        secondaryColor: organization.secondaryColor || ''
      });
    }
  };

  const handleSave = async () => {
    if (!canEditOrganization) {
      toast.error('Seuls les administrateurs peuvent enregistrer ces paramètres');
      return;
    }
    try {
      await updateOrganization({
        name: formData.name,
        description: formData.description,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        website: formData.website,
        timeZone: formData.timeZone,
        currency: formData.currency,
        address: formData.address,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor
      });
      setIsEditing(false);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditOrganization) {
      toast.error('Seuls les administrateurs peuvent modifier le logo');
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 2MB)');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez PNG ou JPG');
      return;
    }

    try {
      await uploadLogo(file);
      toast.success('Logo mis à jour avec succès');
      await fetchOrganization(); // Refresh to get new logo URL
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléchargement du logo');
    }
  };

  if (isLoading && !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <Button onClick={() => fetchOrganization()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Paramètres de l'organisation
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les informations et paramètres de votre organisation
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation par onglets */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                if (tab.adminOnly && !isAdmin) {
                  return null;
                }
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Section Informations */}
            {activeTab === 'info' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Informations de l'organisation
                  </h2>
                  {canEditOrganization ? (
                    !isEditing ? (
                      <Button onClick={handleEdit} variant="outline">
                        Modifier
                      </Button>
                    ) : (
                      <div className="flex space-x-3">
                        <Button onClick={handleCancel} variant="outline">
                          Annuler
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                      </div>
                    )
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      Lecture seule (admin requis)
                    </Badge>
                  )}
                </div>

                {!canEditOrganization && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <p className="text-sm text-amber-800">
                      Vous pouvez consulter les informations, mais seules les personnes ayant le rôle Admin peuvent les modifier.
                    </p>
                  </div>
                )}

                {/* Logo */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {organization?.logoUrl ? (
                      <img 
                        src={organization.logoUrl} 
                        alt="Logo" 
                        className="w-24 h-24 rounded-lg border-2 border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-brand-100 border-2 border-gray-200 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-brand-600" />
                      </div>
                    )}
                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Logo de l'organisation</h3>
                    <p className="text-sm text-gray-500">
                      Format recommandé : PNG ou JPG, taille maximale 2MB
                    </p>
                  </div>
                </div>

                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'organisation *
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nom de l'organisation"
                      />
                    ) : (
                      <p className="text-gray-900">{organization?.name || ''}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domaine
                    </label>
                    <p className="text-gray-900">{organization?.domain || ''}.leadtracker.app</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        placeholder="Description de l'organisation"
                      />
                    ) : (
                      <p className="text-gray-900">{organization?.description || ''}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email de contact
                      </label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          placeholder="contact@organization.com"
                        />
                      ) : (
                        <p className="text-gray-900">{organization?.contactEmail || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Téléphone
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.contactPhone}
                          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      ) : (
                        <p className="text-gray-900">{organization?.contactPhone || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="inline h-4 w-4 mr-1" />
                        Site web
                      </label>
                      {isEditing ? (
                        <Input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://organization.com"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {organization?.website ? (
                            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                              {organization.website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    <MapPin className="inline h-5 w-5 mr-1" />
                    Adresse
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rue
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.address.street}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, street: e.target.value } 
                          })}
                          placeholder="123 Rue Principale"
                        />
                      ) : (
                        <p className="text-gray-900">{organization?.address?.street || organization?.addressStreet || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.address.city}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, city: e.target.value } 
                          })}
                          placeholder="Sherbrooke"
                        />
                      ) : (
                        <p className="text-gray-900">{organization?.address?.city || organization?.addressCity || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Province/État
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.address.state}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, state: e.target.value } 
                          })}
                          placeholder="QC"
                        />
                      ) : (
                        <p className="text-gray-900">{organization?.address?.state || organization?.addressState || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Domaine */}
            {activeTab === 'domain' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion du domaine
                </h2>
                
                <div className="bg-brand-50 border border-brand-200 rounded-md p-4">
                  <div className="flex">
                    <Globe className="h-5 w-5 text-brand-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-brand-800">
                        Domaine actuel
                      </h3>
                      <p className="text-sm text-brand-700 mt-1">
                        Votre organisation est accessible via : <strong>{organization?.domain || ''}.leadtracker.app</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Configuration du domaine personnalisé
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cette fonctionnalité sera disponible dans une prochaine version.
                  </p>
                </div>
              </div>
            )}

            {/* Section Facturation */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Paramètres de facturation
                </h2>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Plan actuel</h3>
                    <Badge variant="default">{billingSettings.plan.name}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Prix</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${billingSettings.plan.price}
                        <span className="text-sm font-normal text-gray-500">/mois</span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Prochaine facturation</p>
                      <p className="text-lg font-medium text-gray-900">
                        {new Date(billingSettings.nextBillingDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Fonctionnalités incluses</h4>
                    <ul className="space-y-1">
                      {billingSettings.plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Gestion complète de la facturation
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Gestion des paiements, factures et changements de plan à venir.
                  </p>
                </div>
              </div>
            )}

            {/* Section Intégrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion des intégrations
                </h2>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Intégrations actives</h3>
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                            <Plug className="h-5 w-5 text-brand-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{integration.name}</h4>
                            <p className="text-sm text-gray-500">{integration.description}</p>
                            <p className="text-xs text-gray-400">
                              Dernière synchronisation : {new Date(integration.lastSync).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="success">Actif</Badge>
                          <Button variant="outline" size="sm">
                            Configurer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center py-8">
                  <Plug className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Catalogue d'intégrations
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Connectez Lead Tracker avec vos outils préférés (Mailchimp, Slack, Zapier, etc.)
                  </p>
                </div>
              </div>
            )}

            {/* Section Membres */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Gestion des membres
                  </h2>
                </div>

                {/* Formulaire d'invitation */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Inviter un nouveau membre
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <Input
                        value={invitationForm.firstName}
                        onChange={(e) => setInvitationForm({ ...invitationForm, firstName: e.target.value })}
                        placeholder="Prénom"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <Input
                        value={invitationForm.lastName}
                        onChange={(e) => setInvitationForm({ ...invitationForm, lastName: e.target.value })}
                        placeholder="Nom"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={invitationForm.email}
                        onChange={(e) => setInvitationForm({ ...invitationForm, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Poste
                      </label>
                      <Input
                        value={invitationForm.jobTitle}
                        onChange={(e) => setInvitationForm({ ...invitationForm, jobTitle: e.target.value })}
                        placeholder="Poste (optionnel)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rôle *
                      </label>
                      <select
                        value={invitationForm.role}
                        onChange={(e) => setInvitationForm({ ...invitationForm, role: e.target.value })}
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        <option value={USER_ROLES.VIEWER}>{ROLE_DISPLAY_NAMES[USER_ROLES.VIEWER]}</option>
                        <option value={USER_ROLES.SALES_REP}>{ROLE_DISPLAY_NAMES[USER_ROLES.SALES_REP]}</option>
                        <option value={USER_ROLES.MANAGER}>{ROLE_DISPLAY_NAMES[USER_ROLES.MANAGER]}</option>
                        <option value={USER_ROLES.ADMIN}>{ROLE_DISPLAY_NAMES[USER_ROLES.ADMIN]}</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message personnalisé (optionnel)
                      </label>
                      <textarea
                        value={invitationForm.message}
                        onChange={(e) => setInvitationForm({ ...invitationForm, message: e.target.value })}
                        rows={3}
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        placeholder="Message personnalisé pour l'invitation..."
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button 
                      onClick={handleSendInvitation}
                      disabled={isSendingInvitation}
                    >
                      {isSendingInvitation ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Envoyer l'invitation
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Liste des invitations en attente */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Invitations en attente
                  </h3>

                  {isLoadingInvitations ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
                      <p className="mt-2 text-sm text-gray-500">Chargement des invitations...</p>
                    </div>
                  ) : pendingInvitations.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="mt-2 text-sm text-gray-500">Aucune invitation en attente</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingInvitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {invitation.firstName} {invitation.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{invitation.email}</p>
                              </div>
                              {invitation.jobTitle && (
                                <Badge variant="outline">{invitation.jobTitle}</Badge>
                              )}
                              <Badge variant={invitation.role === 'Admin' ? 'default' : 'secondary'}>
                                {invitation.role}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                Expire le {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}
                              </span>
                              {invitation.isExpired && (
                                <Badge variant="destructive" className="text-xs">Expirée</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyInvitationUrl(invitation.invitationToken)}
                              title="Copier le lien d'invitation"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              title="Renvoyer l'invitation"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              title="Annuler l'invitation"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Liste des membres de l'organisation */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Membres de l'organisation ({members.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMembers}
                      disabled={isLoadingMembers}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMembers ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>

                  {isLoadingMembers ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
                      <p className="mt-2 text-sm text-gray-500">Chargement des membres...</p>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="mt-2 text-sm text-gray-500">Aucun membre dans l'organisation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                                <span className="text-brand-600 font-medium">
                                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900">
                                    {member.firstName} {member.lastName}
                                  </p>
                                  {(member.roles.includes('admin') || member.roles.includes('Admin')) && (
                                    <Badge variant="default" className="bg-brand-100 text-brand-800">Admin</Badge>
                                  )}
                                  {!member.isActive && (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactif</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                {member.jobTitle && (
                                  <p className="text-xs text-gray-400 mt-1">{member.jobTitle}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              {member.lastLoginAt && (
                                <span>
                                  Dernière connexion : {new Date(member.lastLoginAt).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              <span>
                                Membre depuis : {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {member.roles.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {member.roles.map((role) => (
                                  <Badge 
                                    key={role} 
                                    variant={role === 'Admin' || role === 'admin' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {role === 'Admin' || role === 'admin' ? 'Admin' : role}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}