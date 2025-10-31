'use client';

import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/useToast';
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
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'domain' | 'billing' | 'integrations'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const { organization, isLoading, error, fetchOrganization, updateOrganization, uploadLogo } = useOrganization();
  const toast = useToast();

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

  // Load organization data on mount
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

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
    { id: 'integrations', label: 'Intégrations', icon: Plug }
  ];

  const handleEdit = () => setIsEditing(true);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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
                  {!isEditing ? (
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
                  )}
                </div>

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
                      <div className="w-24 h-24 rounded-lg bg-blue-100 border-2 border-gray-200 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-blue-600" />
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
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
                            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Domaine actuel
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
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
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Plug className="h-5 w-5 text-blue-600" />
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
          </div>
        </div>
      </div>
    </div>
  );
}