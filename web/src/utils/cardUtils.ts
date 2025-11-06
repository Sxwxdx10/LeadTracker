import { KanbanLead } from '@/types/kanban';

/**
 * Generate user initials from name
 */
export const getInitials = (name?: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get priority color based on priority level
 */
export const getPriorityColor = (priority?: string): string => {
  switch (priority) {
    case 'high':
      return '#EF4444';
    case 'medium':
      return '#F59E0B';
    case 'low':
      return '#3B82F6';
    default:
      return '#3B82F6';
  }
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Open':
      return '#3B82F6';
    case 'InProgress':
      return '#F59E0B';
    case 'Qualified':
      return '#10B981';
    case 'Won':
      return '#10B981';
    case 'Lost':
      return '#EF4444';
    case 'Unqualified':
      return '#6B7280';
    default:
      return '#3B82F6';
  }
};

/**
 * Get card color (priority > custom > status)
 */
export const getCardColor = (lead: KanbanLead): string => {
  return lead.color || getPriorityColor(lead.priority) || getStatusColor(lead.status);
};

/**
 * Calculate task progress percentage
 */
export const getTaskProgress = (lead: KanbanLead): number => {
  if (lead.taskCount === 0) return 0;
  return Math.round((lead.completedTaskCount / lead.taskCount) * 100);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Format currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

/**
 * Format days
 */
export const formatDays = (days: number): string => {
  if (days < 1) return '< 1 jour';
  if (days === 1) return '1 jour';
  return `${Math.round(days)} jours`;
};

/**
 * Check if lead is overdue
 */
export const isLeadOverdue = (lead: KanbanLead): boolean => {
  return lead.isOverdue && lead.status !== 'Won';
};

/**
 * Get priority badge variant
 */
export const getPriorityBadgeVariant = (probability: number): 'default' | 'secondary' | 'outline' => {
  if (probability >= 70) return 'default';
  if (probability >= 40) return 'secondary';
  return 'outline';
};

/**
 * Calculate priority level from probability and value
 */
export const calculatePriority = (lead: KanbanLead): 'high' | 'medium' | 'low' => {
  if (lead.priority) return lead.priority;
  
  const probability = lead.probability || 0;
  const value = lead.estimatedValue || 0;
  
  // High: probability > 70% OR value > 100000
  if (probability > 70 || value > 100000) return 'high';
  
  // Medium: probability > 40% OR value > 10000
  if (probability > 40 || value > 10000) return 'medium';
  
  // Low: everything else
  return 'low';
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const getRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  if (diffInSeconds < 31536000) return `Il y a ${Math.floor(diffInSeconds / 2592000)} mois`;
  return `Il y a ${Math.floor(diffInSeconds / 31536000)} an(s)`;
};

/**
 * Get urgency level based on expected close date
 */
export const getUrgencyLevel = (lead: KanbanLead): 'critical' | 'high' | 'medium' | 'low' => {
  if (!lead.expectedCloseDate) return 'low';
  
  const today = new Date();
  const expectedDate = new Date(lead.expectedCloseDate);
  const diffInDays = Math.floor((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) return 'critical'; // Overdue
  if (diffInDays <= 3) return 'high';
  if (diffInDays <= 7) return 'medium';
  return 'low';
};

/**
 * Group leads by field value
 */
export const groupLeadsByField = <T>(leads: T[], field: keyof T): Record<string, T[]> => {
  return leads.reduce((groups, lead) => {
    const value = String(lead[field]);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(lead);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Calculate group metrics
 */
export interface GroupMetrics {
  count: number;
  totalValue: number;
  potentialValue: number;
  averageProbability: number;
}

export const calculateGroupMetrics = (leads: KanbanLead[]): GroupMetrics => {
  const count = leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  const potentialValue = leads.reduce((sum, lead) => {
    return sum + ((lead.estimatedValue || 0) * (lead.probability || 0) / 100);
  }, 0);
  const averageProbability = leads.length > 0 
    ? Math.round(leads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / leads.length)
    : 0;
  
  return {
    count,
    totalValue,
    potentialValue,
    averageProbability
  };
};

