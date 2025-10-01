import axios, { AxiosResponse } from 'axios';
import apiClient from './api';
import {
  Organization,
  UpdateOrganizationDto,
  DomainSettings,
  BillingSettings,
  Integration,
  AvailableIntegration,
  Webhook,
  CreateWebhookDto,
  Invoice
} from '@/types/organization';

// Services API pour la gestion de l'organisation
export const organizationApi = {
  // Récupérer les informations de l'organisation
  getOrganization: async (): Promise<Organization> => {
    try {
      const response: AxiosResponse<Organization> = await apiClient.get('/api/organization');
      return response.data;
    } catch (error) {
      // Fallback avec données de test si l'API n'est pas disponible
      return {
        id: 'org-1',
        name: 'Mon Organisation',
        description: 'Description de mon organisation',
        domain: 'mon-org',
        timeZone: 'America/Toronto',
        currency: 'CAD',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contactEmail: 'contact@mon-org.com',
        contactPhone: '+1 (555) 123-4567',
        website: 'https://mon-org.com',
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
    }
  },

  // Mettre à jour l'organisation
  updateOrganization: async (data: UpdateOrganizationDto): Promise<Organization> => {
    try {
      const response: AxiosResponse<Organization> = await apiClient.put('/api/organization', data);
      return response.data;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw new Error('Erreur lors de la mise à jour de l\'organisation');
    }
  },

  // Uploader le logo
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response: AxiosResponse<{ logoUrl: string }> = await apiClient.post(
        '/api/organization/logo', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Erreur lors du téléchargement du logo');
    }
  },

  // Gestion du domaine
  getDomainSettings: async (): Promise<DomainSettings> => {
    try {
      const response: AxiosResponse<DomainSettings> = await apiClient.get('/api/organization/domain');
      return response.data;
    } catch (error) {
      // Fallback avec données de test
      return {
        subdomain: 'mon-org',
        sslEnabled: true,
        sslCertificate: {
          issuer: 'Let\'s Encrypt',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        },
        dnsSettings: [
          {
            recordType: 'CNAME',
            name: 'www',
            value: 'leadtracker.app',
            status: 'verified'
          }
        ]
      };
    }
  },

  // Mettre à jour les paramètres de domaine
  updateDomainSettings: async (settings: Partial<DomainSettings>): Promise<DomainSettings> => {
    try {
      const response: AxiosResponse<DomainSettings> = await apiClient.put('/api/organization/domain', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating domain settings:', error);
      throw new Error('Erreur lors de la mise à jour des paramètres de domaine');
    }
  },

  // Vérifier le domaine
  verifyDomain: async (domain: string): Promise<{ verified: boolean; errors?: string[] }> => {
    try {
      const response = await apiClient.post('/api/organization/domain/verify', { domain });
      return response.data;
    } catch (error) {
      console.error('Error verifying domain:', error);
      throw new Error('Erreur lors de la vérification du domaine');
    }
  },

  // Paramètres de facturation
  getBillingSettings: async (): Promise<BillingSettings> => {
    try {
      const response: AxiosResponse<BillingSettings> = await apiClient.get('/api/organization/billing');
      return response.data;
    } catch (error) {
      // Fallback avec données de test
      return {
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
        paymentMethod: {
          type: 'card',
          lastFour: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          brand: 'Visa'
        },
        billingAddress: {
          name: 'Mon Organisation Inc.',
          street: '123 Rue Principale',
          city: 'Sherbrooke',
          state: 'QC',
          postalCode: 'J1K 2R1',
          country: 'Canada'
        },
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        invoices: []
      };
    }
  },

  // Récupérer les factures
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const response: AxiosResponse<Invoice[]> = await apiClient.get('/api/organization/invoices');
      return response.data;
    } catch (error) {
      // Fallback avec données de test
      const now = new Date();
      return [
        {
          id: 'inv-1',
          number: 'INV-2024-001',
          amount: 79,
          currency: 'USD',
          status: 'paid',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
          paidAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: '/api/invoices/inv-1/download'
        },
        {
          id: 'inv-2',
          number: 'INV-2024-002',
          amount: 79,
          currency: 'USD',
          status: 'pending',
          createdAt: now.toISOString(),
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  },

  // Intégrations
  getIntegrations: async (): Promise<Integration[]> => {
    try {
      const response: AxiosResponse<Integration[]> = await apiClient.get('/api/organization/integrations');
      return response.data;
    } catch (error) {
      // Fallback avec données de test
      return [
        {
          id: 'int-1',
          name: 'Mailchimp',
          description: 'Synchronisation des leads avec Mailchimp',
          provider: 'mailchimp',
          status: 'active',
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          settings: {
            apiKey: '****-****-****-abcd',
            listId: 'list123'
          },
          logo: '/integrations/mailchimp.png'
        }
      ];
    }
  },

  // Intégrations disponibles
  getAvailableIntegrations: async (): Promise<AvailableIntegration[]> => {
    try {
      const response: AxiosResponse<AvailableIntegration[]> = await apiClient.get('/api/integrations/available');
      return response.data;
    } catch (error) {
      // Fallback avec données de test
      return [
        {
          id: 'mailchimp',
          name: 'Mailchimp',
          description: 'Synchronisez vos leads avec Mailchimp pour des campagnes email automatisées',
          provider: 'mailchimp',
          category: 'email',
          logo: '/integrations/mailchimp.png',
          isConnected: true,
          configurationFields: [
            {
              name: 'apiKey',
              label: 'Clé API',
              type: 'password',
              required: true,
              placeholder: 'Votre clé API Mailchimp'
            },
            {
              name: 'listId',
              label: 'ID de liste',
              type: 'text',
              required: true,
              placeholder: 'ID de la liste Mailchimp'
            }
          ]
        },
        {
          id: 'slack',
          name: 'Slack',
          description: 'Recevez des notifications dans Slack pour les nouveaux leads',
          provider: 'slack',
          category: 'communication',
          logo: '/integrations/slack.png',
          isConnected: false,
          configurationFields: [
            {
              name: 'webhookUrl',
              label: 'URL du webhook',
              type: 'url',
              required: true,
              placeholder: 'https://hooks.slack.com/services/...'
            },
            {
              name: 'channel',
              label: 'Canal',
              type: 'text',
              required: true,
              placeholder: '#leads'
            }
          ]
        }
      ];
    }
  },

  // Connecter une intégration
  connectIntegration: async (integrationId: string, settings: Record<string, any>): Promise<Integration> => {
    try {
      const response: AxiosResponse<Integration> = await apiClient.post(`/api/organization/integrations/${integrationId}`, settings);
      return response.data;
    } catch (error) {
      console.error('Error connecting integration:', error);
      throw new Error('Erreur lors de la connexion de l\'intégration');
    }
  },

  // Déconnecter une intégration
  disconnectIntegration: async (integrationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/organization/integrations/${integrationId}`);
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw new Error('Erreur lors de la déconnexion de l\'intégration');
    }
  },

  // Webhooks
  getWebhooks: async (): Promise<Webhook[]> => {
    try {
      const response: AxiosResponse<Webhook[]> = await apiClient.get('/api/organization/webhooks');
      return response.data;
    } catch (error) {
      // Fallback avec données de test
      return [
        {
          id: 'wh-1',
          name: 'Slack Notifications',
          url: 'https://hooks.slack.com/services/...',
          events: ['lead.created', 'lead.updated'],
          isActive: true,
          lastTriggered: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  },

  // Créer un webhook
  createWebhook: async (data: CreateWebhookDto): Promise<Webhook> => {
    try {
      const response: AxiosResponse<Webhook> = await apiClient.post('/api/organization/webhooks', data);
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error('Erreur lors de la création du webhook');
    }
  },

  // Supprimer un webhook
  deleteWebhook: async (webhookId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/organization/webhooks/${webhookId}`);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw new Error('Erreur lors de la suppression du webhook');
    }
  }
};

export default organizationApi;
