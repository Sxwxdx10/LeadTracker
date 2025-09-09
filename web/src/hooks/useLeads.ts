import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  leadsApi, 
  stagesApi 
} from '@/lib/api';
import { 
  LeadQueryParams, 
  CreateLeadDto, 
  UpdateLeadDto 
} from '@/types/lead';

// Query keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (params?: LeadQueryParams) => [...leadKeys.lists(), params] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  stats: () => [...leadKeys.all, 'stats'] as const,
};

export const stageKeys = {
  all: ['stages'] as const,
  lists: () => [...stageKeys.all, 'list'] as const,
  details: () => [...stageKeys.all, 'detail'] as const,
  detail: (id: string) => [...stageKeys.details(), id] as const,
};

// Hook pour récupérer la liste des leads
export function useLeads(params?: LeadQueryParams) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => leadsApi.getLeads(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour récupérer un lead spécifique
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadsApi.getLead(id),
    enabled: !!id,
  });
}

// Hook pour récupérer les statistiques des leads
export function useLeadStats() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: () => leadsApi.getLeadStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour récupérer les stages
export function useStages() {
  return useQuery({
    queryKey: stageKeys.lists(),
    queryFn: () => stagesApi.getStages(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook pour créer un lead
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadDto) => leadsApi.createLead(data),
    onSuccess: (newLead) => {
      // Invalider et refetch les listes de leads
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      
      toast.success('Lead créé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création du lead:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création du lead');
    },
  });
}

// Hook pour mettre à jour un lead
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadDto }) => 
      leadsApi.updateLead(id, data),
    onSuccess: (updatedLead, { id }) => {
      // Mettre à jour le cache pour ce lead spécifique
      queryClient.setQueryData(leadKeys.detail(id), updatedLead);
      
      // Invalider les listes pour refléter les changements
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      
      toast.success('Lead mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du lead:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du lead');
    },
  });
}

// Hook pour supprimer un lead
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsApi.deleteLead(id),
    onSuccess: (_, deletedId) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: leadKeys.detail(deletedId) });
      
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      
      toast.success('Lead supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du lead:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du lead');
    },
  });
}
