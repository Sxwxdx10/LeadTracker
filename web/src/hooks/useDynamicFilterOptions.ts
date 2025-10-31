import { useMemo } from 'react';
import { Lead, Stage } from '@/types/lead';
import { getStageFilterOptions } from '@/utils/kanbanFilterUtils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface DynamicFilterOptions {
  stages: FilterOption[];
  users: FilterOption[];
  statuses: FilterOption[];
  companies: FilterOption[];
}

// Hook pour extraire les options de filtres dynamiquement depuis les données des leads
export const useDynamicFilterOptions = (leads: Lead[] = [], stages: Stage[] = []) => {
  return useMemo(() => {
    // Utiliser la logique du Kanban pour les stages
    const stageOptions = getStageFilterOptions(stages, leads);

    // Extraire les utilisateurs uniques (propriétaires)
    const userMap = new Map<string, string>();
    leads.forEach(lead => {
      const assignedUserId = lead.assignedUserId;
      const assignedUserName = lead.assignedUserName;
      
      if (assignedUserId && assignedUserName) {
        userMap.set(assignedUserId, assignedUserName);
      }
    });
    
    const users: FilterOption[] = Array.from(userMap.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));

    // Extraire les statuts uniques
    const statusMap = new Map<string, string>();
    leads.forEach(lead => {
      if (lead.status) {
        const statusLabels: Record<string, string> = {
          'Open': 'Ouvert',
          'InProgress': 'En cours',
          'Qualified': 'Qualifié',
          'Won': 'Gagné',
          'Lost': 'Perdu',
          'Unqualified': 'Non qualifié',
        };
        statusMap.set(lead.status, statusLabels[lead.status] || lead.status);
      }
    });
    const statuses: FilterOption[] = Array.from(statusMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));

    // Extraire les entreprises uniques
    const companyMap = new Map<string, string>();
    leads.forEach(lead => {
      if (lead.company) {
        companyMap.set(lead.company, lead.company);
      }
    });
    const companies: FilterOption[] = Array.from(companyMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));

    return {
      stages: stageOptions,
      users,
      statuses,
      companies,
    };
  }, [leads, stages]);
};
