'use client';

import React, { useState } from 'react';
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

  // Données statiques pour le test
  const organization = {
    name: 'Mon Organisation',
    description: 'Description de mon organisation',
    domain: 'mon-org',
    contactEmail: 'contact@mon-org.com',
    contactPhone: '+1 (555) 123-4567',
    website: 'https://mon-org.com',
    timeZone: 'America/Toronto',
    currency: 'CAD',
    address: {
      street: '123 Rue Principale',
      city: 'Sherbrooke',
      state: 'QC',
      postalCode: 'J1K 2R1',
      country: 'Canada'
    },
    primaryColor: '#3B82F6',
    secondaryColor: '#64748B'
  };

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
  const handleCancel = () => setIsEditing(false);
  const handleSave = () => {
    setIsEditing(false);
    alert('Paramètres sauvegardés (demo)');
  };

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
                    <div className="w-24 h-24 rounded-lg bg-blue-100 border-2 border-gray-200 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
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
                        defaultValue={organization.name}
                        placeholder="Nom de l'organisation"
                      />
                    ) : (
                      <p className="text-gray-900">{organization.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domaine
                    </label>
                    <p className="text-gray-900">{organization.domain}.leadtracker.app</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        defaultValue={organization.description}
                        rows={3}
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        placeholder="Description de l'organisation"
                      />
                    ) : (
                      <p className="text-gray-900">{organization.description}</p>
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
                          defaultValue={organization.contactEmail}
                          placeholder="contact@organization.com"
                        />
                      ) : (
                        <p className="text-gray-900">{organization.contactEmail}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Téléphone
                      </label>
                      {isEditing ? (
                        <Input
                          defaultValue={organization.contactPhone}
                          placeholder="+1 (555) 123-4567"
                        />
                      ) : (
                        <p className="text-gray-900">{organization.contactPhone}</p>
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
                          defaultValue={organization.website}
                          placeholder="https://organization.com"
                        />
                      ) : (
                        <p className="text-gray-900">
                          <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {organization.website}
                          </a>
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
                          defaultValue={organization.address.street}
                          placeholder="123 Rue Principale"
                        />
                      ) : (
                        <p className="text-gray-900">{organization.address.street}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville
                      </label>
                      {isEditing ? (
                        <Input
                          defaultValue={organization.address.city}
                          placeholder="Sherbrooke"
                        />
                      ) : (
                        <p className="text-gray-900">{organization.address.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Province/État
                      </label>
                      {isEditing ? (
                        <Input
                          defaultValue={organization.address.state}
                          placeholder="QC"
                        />
                      ) : (
                        <p className="text-gray-900">{organization.address.state}</p>
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
                        Votre organisation est accessible via : <strong>{organization.domain}.leadtracker.app</strong>
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

        {/* Statut de développement */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ✅ Page des paramètres d'organisation fonctionnelle !
              </h3>
              <div className="text-sm text-green-700 mt-2">
                <p className="mb-2">Fonctionnalités implémentées :</p>
                <ul className="space-y-1">
                  <li>• Interface avec onglets de navigation</li>
                  <li>• Section informations de l'organisation (éditable)</li>
                  <li>• Gestion du domaine (vue de base)</li>
                  <li>• Paramètres de facturation (aperçu du plan)</li>
                  <li>• Gestion des intégrations (liste des intégrations actives)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}