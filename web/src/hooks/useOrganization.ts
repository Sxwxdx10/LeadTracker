import { useState, useEffect, useCallback } from 'react';
import { organizationApi } from '@/lib/organization-api';
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

export interface UseOrganizationResult {
  // État de l'organisation
  organization: Organization | null;
  domainSettings: DomainSettings | null;
  billingSettings: BillingSettings | null;
  integrations: Integration[];
  availableIntegrations: AvailableIntegration[];
  webhooks: Webhook[];
  invoices: Invoice[];
  
  // États de chargement
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions
  fetchOrganization: () => Promise<void>;
  updateOrganization: (data: UpdateOrganizationDto) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  fetchDomainSettings: () => Promise<void>;
  updateDomainSettings: (settings: Partial<DomainSettings>) => Promise<void>;
  verifyDomain: (domain: string) => Promise<{ verified: boolean; errors?: string[] }>;
  fetchBillingSettings: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchIntegrations: () => Promise<void>;
  fetchAvailableIntegrations: () => Promise<void>;
  connectIntegration: (integrationId: string, settings: Record<string, any>) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  fetchWebhooks: () => Promise<void>;
  createWebhook: (data: CreateWebhookDto) => Promise<void>;
  deleteWebhook: (webhookId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useOrganization(): UseOrganizationResult {
  // État
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [domainSettings, setDomainSettings] = useState<DomainSettings | null>(null);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const fetchOrganization = useCallback(async () => {
    try {
      setError(null);
      const org = await organizationApi.getOrganization();
      setOrganization(org);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'organisation');
      console.error('Error fetching organization:', err);
    }
  }, []);

  const updateOrganization = useCallback(async (data: UpdateOrganizationDto) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedOrg = await organizationApi.updateOrganization(data);
      setOrganization(updatedOrg);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const uploadLogo = useCallback(async (file: File) => {
    try {
      setIsUpdating(true);
      setError(null);
      const result = await organizationApi.uploadLogo(file);
      
      // Mettre à jour l'organisation avec le nouveau logo
      if (organization) {
        setOrganization({
          ...organization,
          logoUrl: result.logoUrl
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement du logo');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [organization]);

  const fetchDomainSettings = useCallback(async () => {
    try {
      setError(null);
      const settings = await organizationApi.getDomainSettings();
      setDomainSettings(settings);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des paramètres de domaine');
      console.error('Error fetching domain settings:', err);
    }
  }, []);

  const updateDomainSettings = useCallback(async (settings: Partial<DomainSettings>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedSettings = await organizationApi.updateDomainSettings(settings);
      setDomainSettings(updatedSettings);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour des paramètres de domaine');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const verifyDomain = useCallback(async (domain: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      const result = await organizationApi.verifyDomain(domain);
      
      // Rafraîchir les paramètres de domaine après vérification
      await fetchDomainSettings();
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification du domaine');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchDomainSettings]);

  const fetchBillingSettings = useCallback(async () => {
    try {
      setError(null);
      const settings = await organizationApi.getBillingSettings();
      setBillingSettings(settings);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des paramètres de facturation');
      console.error('Error fetching billing settings:', err);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setError(null);
      const invoiceList = await organizationApi.getInvoices();
      setInvoices(invoiceList);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des factures');
      console.error('Error fetching invoices:', err);
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      setError(null);
      const integrationList = await organizationApi.getIntegrations();
      setIntegrations(integrationList);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des intégrations');
      console.error('Error fetching integrations:', err);
    }
  }, []);

  const fetchAvailableIntegrations = useCallback(async () => {
    try {
      setError(null);
      const availableList = await organizationApi.getAvailableIntegrations();
      setAvailableIntegrations(availableList);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des intégrations disponibles');
      console.error('Error fetching available integrations:', err);
    }
  }, []);

  const connectIntegration = useCallback(async (integrationId: string, settings: Record<string, any>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const newIntegration = await organizationApi.connectIntegration(integrationId, settings);
      
      // Ajouter la nouvelle intégration à la liste
      setIntegrations(prev => [...prev, newIntegration]);
      
      // Mettre à jour la liste des intégrations disponibles
      setAvailableIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, isConnected: true }
            : integration
        )
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion de l\'intégration');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      await organizationApi.disconnectIntegration(integrationId);
      
      // Retirer l'intégration de la liste
      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      
      // Mettre à jour la liste des intégrations disponibles
      setAvailableIntegrations(prev => 
        prev.map(integration => 
          integration.provider === integrationId 
            ? { ...integration, isConnected: false }
            : integration
        )
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la déconnexion de l\'intégration');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const fetchWebhooks = useCallback(async () => {
    try {
      setError(null);
      const webhookList = await organizationApi.getWebhooks();
      setWebhooks(webhookList);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des webhooks');
      console.error('Error fetching webhooks:', err);
    }
  }, []);

  const createWebhook = useCallback(async (data: CreateWebhookDto) => {
    try {
      setIsUpdating(true);
      setError(null);
      const newWebhook = await organizationApi.createWebhook(data);
      setWebhooks(prev => [...prev, newWebhook]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du webhook');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteWebhook = useCallback(async (webhookId: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      await organizationApi.deleteWebhook(webhookId);
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du webhook');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchOrganization(),
      fetchDomainSettings(),
      fetchBillingSettings(),
      fetchInvoices(),
      fetchIntegrations(),
      fetchAvailableIntegrations(),
      fetchWebhooks()
    ]);
  }, [
    fetchOrganization,
    fetchDomainSettings, 
    fetchBillingSettings,
    fetchInvoices,
    fetchIntegrations,
    fetchAvailableIntegrations,
    fetchWebhooks
  ]);

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await refreshAll();
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    organization,
    domainSettings,
    billingSettings,
    integrations,
    availableIntegrations,
    webhooks,
    invoices,
    isLoading,
    isUpdating,
    error,
    fetchOrganization,
    updateOrganization,
    uploadLogo,
    fetchDomainSettings,
    updateDomainSettings,
    verifyDomain,
    fetchBillingSettings,
    fetchInvoices,
    fetchIntegrations,
    fetchAvailableIntegrations,
    connectIntegration,
    disconnectIntegration,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
    refreshAll
  };
}
