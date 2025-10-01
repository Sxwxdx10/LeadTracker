// Types pour la gestion des utilisateurs

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  jobTitle?: string;
  isActive: boolean;
  lastLoginAt?: string;
  identityUserId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  roles: string[];
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  jobTitle?: string;
  roles: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface InviteUserDto {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  roles: string[];
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  role?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedUsersResponse {
  data: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingInvitations: number;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
}

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES_REP: 'sales_rep',
  VIEWER: 'viewer'
} as const;

export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: 'Administrateur',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.SALES_REP]: 'Commercial',
  [USER_ROLES.VIEWER]: 'Lecture seule'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
