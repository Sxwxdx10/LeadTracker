import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  stages: FilterOption[];
  users: FilterOption[];
  statuses: FilterOption[];
}

// Hook pour récupérer les options de filtres depuis l'API
export const useFilterOptions = () => {
  return useQuery<FilterOptions>({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      // Récupérer les stages
      const stagesResponse = await fetch('/api/stages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const stagesData = await stagesResponse.json();
      
      // Récupérer les users
      const usersResponse = await fetch('/api/users?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const usersData = await usersResponse.json();
      
      // Définir les statuts disponibles
      const statuses = [
        { value: 'Open', label: 'Ouvert' },
        { value: 'InProgress', label: 'En cours' },
        { value: 'Qualified', label: 'Qualifié' },
        { value: 'Won', label: 'Gagné' },
        { value: 'Lost', label: 'Perdu' },
        { value: 'Unqualified', label: 'Non qualifié' },
      ];
      
      return {
        stages: stagesData.map((stage: any) => ({
          value: stage.id,
          label: stage.name,
        })),
        users: usersData.data?.map((user: any) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName}`,
        })) || [],
        statuses,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

