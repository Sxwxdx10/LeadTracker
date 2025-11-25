import axios, { AxiosResponse } from 'axios';
import apiClient from './api';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  InviteUserDto,
  UserQueryParams,
  PaginatedUsersResponse,
  UserStats,
  Role,
  UserInvitation
} from '@/types/user';
import { UserInfo } from '@/types/auth';

// Services API pour les utilisateurs
export const usersApi = {
  // Récupérer la liste paginée des utilisateurs
  getUsers: async (params?: UserQueryParams): Promise<PaginatedUsersResponse> => {
    const response: AxiosResponse<any> = await apiClient.get('/api/users', {
      params,
    });

    const payload = response.data || {};
    const rawUsers = payload.data ?? payload.users ?? [];
    const users = Array.isArray(rawUsers) ? rawUsers : [];
    const totalCount = payload.totalCount ?? payload.count ?? users.length ?? 0;
    const page = payload.page ?? params?.page ?? 1;
    const pageSize = payload.pageSize ?? params?.pageSize ?? (users.length || 1);
    const totalPages = payload.totalPages ?? Math.ceil(totalCount / (pageSize || 1));

    return {
      data: users,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: payload.hasNextPage ?? page < totalPages,
      hasPreviousPage: payload.hasPreviousPage ?? page > 1,
    };
  },

  // Récupérer un utilisateur par ID
  getUser: async (id: string): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },

  // Créer un nouvel utilisateur
  createUser: async (data: CreateUserDto): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.post('/api/users', data);
    return response.data;
  },

  // Inviter un nouvel utilisateur
  inviteUser: async (data: InviteUserDto): Promise<{ success: boolean; message: string; invitationId?: string; invitationUrl?: string }> => {
    try {
      const response: AxiosResponse<{ success: boolean; message: string; invitationId?: string; invitationUrl?: string }> = await apiClient.post('/api/users/invite', data);
      return response.data;
    } catch (error: any) {
      // If the backend returns an error response with a body, extract it
      if (error.response?.data) {
        // If the response has a success field, it's the InviteUserResponse format
        if (error.response.data.success !== undefined) {
          return error.response.data;
        }
        // Otherwise, throw with the error message
        throw new Error(error.response.data.message || error.response.data.error || 'Erreur lors de l\'invitation');
      }
      throw error;
    }
  },

  // Récupérer les invitations en attente
  getPendingInvitations: async (): Promise<UserInvitation[]> => {
    const response: AxiosResponse<UserInvitation[]> = await apiClient.get('/api/users/invitations');
    return response.data;
  },

  // Annuler une invitation
  cancelInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await apiClient.delete(`/api/users/invitations/${invitationId}`);
    return response.data;
  },

  // Renvoyer une invitation
  resendInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await apiClient.post(`/api/users/invitations/${invitationId}/resend`);
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.put(`/api/users/${id}`, data);
    return response.data;
  },

  // Mettre à jour le profil de l'utilisateur connecté
  updateCurrentUser: async (data: UpdateProfileDto): Promise<UserInfo> => {
    const response: AxiosResponse<UserInfo> = await apiClient.put('/api/users/me', data);
    return response.data;
  },

  // Activer/désactiver un utilisateur
  toggleUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.patch(`/api/users/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },

  // Récupérer les statistiques des utilisateurs
  getUserStats: async (): Promise<UserStats> => {
    try {
      const response: AxiosResponse<UserStats> = await apiClient.get('/api/users/stats');
      return response.data;
    } catch (error) {
      // Return default stats if endpoint doesn't exist
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingInvitations: 0
      };
    }
  },

  // Récupérer les rôles disponibles
  getRoles: async (): Promise<Role[]> => {
    try {
      const response: AxiosResponse<Role[]> = await apiClient.get('/api/users/roles');
      return response.data;
    } catch (error) {
      // Return default roles if endpoint doesn't exist
      return [
        { id: 'admin', name: 'admin', displayName: 'Administrateur', permissions: [] },
        { id: 'manager', name: 'manager', displayName: 'Manager', permissions: [] },
        { id: 'sales_rep', name: 'sales_rep', displayName: 'Commercial', permissions: [] },
        { id: 'viewer', name: 'viewer', displayName: 'Lecture seule', permissions: [] }
      ];
    }
  },

  // Mettre à jour les rôles d'un utilisateur
  updateUserRoles: async (id: string, roles: string[]): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.patch(`/api/users/${id}/roles`, {
      roles,
    });
    return response.data;
  },

};

export default usersApi;
