// LeadStatus aligné avec le backend (LeadStatus.cs)
// Backend enum: Open = 1, Qualified = 2, Won = 3, Lost = 4, Cancelled = 5
export type LeadStatus = 'Open' | 'Qualified' | 'Won' | 'Lost' | 'Cancelled';

export interface Lead {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  website?: string;
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
  assignedUserId?: string;
  assignedUserName?: string;
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
  website?: string;
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
  website?: string;
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

export interface SearchSuggestion {
  text: string;
  type: string; // "name", "email", "company", "notes"
  count: number;
}

export interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string | undefined;
  stageId?: string | undefined;
  status?: string | undefined; // Changed from LeadStatus to string to match backend
  assignedUserId?: string | undefined; // Changed from ownerId to assignedUserId to match backend
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
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
