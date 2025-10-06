export type LeadStatus = 'Open' | 'InProgress' | 'Qualified' | 'Unqualified' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  source?: string;
  status: LeadStatus;
  stageId: string;
  stageName?: string;
  stage?: Stage;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color?: string;
  organizationId: string;
  isWonStage?: boolean;
  isLostStage?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface CreateLeadDto {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  source?: string;
  stageId: string;
}

export interface UpdateLeadDto {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  source?: string;
  status?: LeadStatus;
  stageId?: string;
}

export interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string | undefined;
  stageId?: string | undefined;
  status?: LeadStatus | undefined;
  ownerId?: string | undefined;
}

export interface PaginatedLeadsResponse {
  data: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LeadStats {
  totalLeads: number;
  openLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
}
