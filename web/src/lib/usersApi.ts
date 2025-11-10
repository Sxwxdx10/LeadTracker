import apiClient from '@/lib/api';

export interface SimpleUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
}

/**
 * API client for user operations
 */
export const usersApi = {
  /**
   * Get simple list of users for task assignment
   */
  getSimpleUsers: async (): Promise<SimpleUser[]> => {
    const response = await apiClient.get<SimpleUser[]>('/api/users/simple');
    return response.data;
  },
};

