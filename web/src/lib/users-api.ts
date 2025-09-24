import axios, { AxiosResponse } from 'axios';
import apiClient from './api';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  InviteUserDto,
  UserQueryParams,
  PaginatedUsersResponse,
  UserStats,
  Role
} from '@/types/user';

// Services API pour les utilisateurs
export const usersApi = {
  // Récupérer la liste paginée des utilisateurs
  getUsers: async (params?: UserQueryParams): Promise<PaginatedUsersResponse> => {
    const response: AxiosResponse<PaginatedUsersResponse> = await apiClient.get('/api/users', {
      params,
    });
    return response.data;
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
  inviteUser: async (data: InviteUserDto): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await apiClient.post('/api/users/invite', data);
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.put(`/api/users/${id}`, data);
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

  // Renvoyer une invitation
  resendInvitation: async (id: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await apiClient.post(`/api/users/${id}/resend-invitation`);
    return response.data;
  },
};

export default usersApi;
