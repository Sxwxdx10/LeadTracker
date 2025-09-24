import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/lib/users-api';
import {
  User,
  PaginatedUsersResponse,
  UserQueryParams,
  CreateUserDto,
  UpdateUserDto,
  InviteUserDto,
  UserStats,
  Role
} from '@/types/user';

export interface UseUsersResult {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  error: string | null;
  stats: UserStats | null;
  roles: Role[];
  
  // Actions
  fetchUsers: (params?: UserQueryParams) => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<User>;
  inviteUser: (data: InviteUserDto) => Promise<void>;
  updateUser: (id: string, data: UpdateUserDto) => Promise<User>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<void>;
  updateUserRoles: (id: string, roles: string[]) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useUsers(initialParams?: UserQueryParams): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [queryParams, setQueryParams] = useState<UserQueryParams>(initialParams || {});

  // Récupérer la liste des utilisateurs
  const fetchUsers = useCallback(async (params?: UserQueryParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const finalParams = { ...queryParams, ...params };
      setQueryParams(finalParams);
      
      const response: PaginatedUsersResponse = await usersApi.getUsers(finalParams);
      
      setUsers(response.data);
      setTotalCount(response.totalCount);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setHasNextPage(response.hasNextPage);
      setHasPreviousPage(response.hasPreviousPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const userStats = await usersApi.getUserStats();
      setStats(userStats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  }, []);

  // Récupérer les rôles
  const fetchRoles = useCallback(async () => {
    try {
      const userRoles = await usersApi.getRoles();
      setRoles(userRoles);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, []);

  // Créer un utilisateur
  const createUser = useCallback(async (data: CreateUserDto): Promise<User> => {
    try {
      const newUser = await usersApi.createUser(data);
      await fetchUsers(); // Rafraîchir la liste
      await fetchStats(); // Rafraîchir les stats
      return newUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchUsers, fetchStats]);

  // Inviter un utilisateur
  const inviteUser = useCallback(async (data: InviteUserDto): Promise<void> => {
    try {
      await usersApi.inviteUser(data);
      await fetchUsers(); // Rafraîchir la liste
      await fetchStats(); // Rafraîchir les stats
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchUsers, fetchStats]);

  // Mettre à jour un utilisateur
  const updateUser = useCallback(async (id: string, data: UpdateUserDto): Promise<User> => {
    try {
      const updatedUser = await usersApi.updateUser(id, data);
      
      // Mettre à jour la liste locale
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
      
      await fetchStats(); // Rafraîchir les stats
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchStats]);

  // Activer/désactiver un utilisateur
  const toggleUserStatus = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    try {
      const updatedUser = await usersApi.toggleUserStatus(id, isActive);
      
      // Mettre à jour la liste locale
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
      
      await fetchStats(); // Rafraîchir les stats
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du changement de statut';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchStats]);

  // Mettre à jour les rôles d'un utilisateur
  const updateUserRoles = useCallback(async (id: string, userRoles: string[]): Promise<void> => {
    try {
      const updatedUser = await usersApi.updateUserRoles(id, userRoles);
      
      // Mettre à jour la liste locale
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour des rôles';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Supprimer un utilisateur
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      await usersApi.deleteUser(id);
      
      // Retirer de la liste locale
      setUsers(prev => prev.filter(user => user.id !== id));
      setTotalCount(prev => prev - 1);
      
      await fetchStats(); // Rafraîchir les stats
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchStats]);

  // Renvoyer une invitation
  const resendInvitation = useCallback(async (id: string): Promise<void> => {
    try {
      await usersApi.resendInvitation(id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du renvoi de l\'invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Rafraîchir les données
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchStats(),
      fetchRoles()
    ]);
  }, [fetchUsers, fetchStats, fetchRoles]);

  // Charger les données initiales
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchUsers(),
          fetchStats().catch(() => console.log('Stats not available')),
          fetchRoles().catch(() => console.log('Roles not available'))
        ]);
      } catch (error) {
        console.error('Error initializing user data:', error);
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  return {
    users,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    error,
    stats,
    roles,
    fetchUsers,
    createUser,
    inviteUser,
    updateUser,
    toggleUserStatus,
    updateUserRoles,
    deleteUser,
    resendInvitation,
    refetch,
  };
}
