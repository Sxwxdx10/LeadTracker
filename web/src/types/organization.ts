// Types pour les paramètres d'organisation

export interface Organization {
  id: string;
  name: string;
  description?: string;
  domain: string;
  timeZone?: string;
  currency?: string;
  isActive: boolean;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Informations de contact
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  
  // Adresse
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // Adresse (version plate pour correspondre au backend)
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  
  // Logo et branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  timeZone?: string;
  currency?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  // Adresse version plate pour correspondre au backend
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Gestion du domaine
export interface DomainSettings {
  customDomain?: string;
  subdomain: string;
  sslEnabled: boolean;
  sslCertificate?: {
    issuer: string;
    expiresAt: string;
    status: 'active' | 'expired' | 'pending';
  };
  dnsSettings?: {
    recordType: string;
    name: string;
    value: string;
    status: 'verified' | 'pending' | 'failed';
  }[];
}

// Paramètres de facturation
export interface BillingSettings {
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    features: string[];
  };
  paymentMethod?: {
    type: 'card' | 'bank_transfer';
    lastFour?: string;
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string;
  };
  billingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    vatNumber?: string;
  };
  nextBillingDate?: string;
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
}

// Intégrations
export interface Integration {
  id: string;
  name: string;
  description: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  settings: Record<string, any>;
  logo?: string;
}

export interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'crm' | 'email' | 'analytics' | 'payment' | 'communication' | 'other';
  logo: string;
  isConnected: boolean;
  configurationFields: IntegrationField[];
}

export interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'boolean' | 'url';
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

// Webhooks
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastTriggered?: string;
  createdAt: string;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

// Plans disponibles
export const AVAILABLE_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    currency: 'USD',
    interval: 'monthly' as const,
    features: [
      'Jusqu\'à 1000 leads',
      '3 utilisateurs',
      'Support email',
      'Intégrations de base'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    currency: 'USD',
    interval: 'monthly' as const,
    features: [
      'Leads illimités',
      '10 utilisateurs',
      'Support prioritaire',
      'Toutes les intégrations',
      'Rapports avancés',
      'API personnalisée'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'USD',
    interval: 'monthly' as const,
    features: [
      'Tout de Professional',
      'Utilisateurs illimités',
      'Support dédié',
      'SSO',
      'Domaine personnalisé',
      'SLA garanti'
    ]
  }
] as const;

// Devises supportées
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'Dollar américain', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£' }
] as const;

// Fuseaux horaires
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' }
] as const;
