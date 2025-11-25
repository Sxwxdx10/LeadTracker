import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { leadsApi, stagesApi } from '@/lib/api';
import { Lead, LeadStats } from '@/types/lead';
import { 
  KanbanBoard, 
  KanbanColumn, 
  KanbanLead, 
  KanbanMetrics,
  MoveLeadRequest,
  UpdateKanbanLeadRequest,
  CreateStageRequest,
  UpdateStageRequest
} from '@/types/kanban';
import { toast } from 'react-hot-toast';

// Query Keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  board: () => [...kanbanKeys.all, 'board'] as const,
  stages: () => [...kanbanKeys.all, 'stages'] as const,
  metrics: () => [...kanbanKeys.all, 'metrics'] as const,
};

// Transformation functions
export const transformLeadToKanbanLead = (lead: Lead): KanbanLead => {
  return {
    id: lead.id,
    title: lead.title,
    contactName: `${lead.firstName} ${lead.lastName}`,
    company: lead.company || '',
    email: lead.email || '',
    phoneNumber: lead.phoneNumber || '',
    estimatedValue: lead.estimatedValue || 0,
    probability: lead.probability || 0,
    expectedCloseDate: lead.expectedCloseDate || '',
    lastContactedAt: lead.updatedAt, // Use updatedAt as fallback
    status: lead.status,
    stageId: lead.stageId || '',
    stageName: lead.stage?.name,
    stage: lead.stage ? {
      id: lead.stage.id,
      name: lead.stage.name
    } : undefined,
    assignedUserId: '', // Not available in Lead type
    assignedUserName: '', // Not available in Lead type
    taskCount: 0, // Default values for Kanban-specific fields
    completedTaskCount: 0,
    createdAt: lead.createdAt,
    stageEnteredAt: lead.createdAt, // Use createdAt as fallback
    isOverdue: false, // Calculate based on expectedCloseDate if needed
  };
};

// Create detailed columns based on stage names but grouped by status
export const createVirtualColumns = (leads: Lead[], stages: any[]): KanbanColumn[] => {
  const calculateColumnMetrics = (leads: Lead[]) => {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
    const potentialValue = leads.reduce((sum, lead) => sum + ((lead.estimatedValue || 0) * (lead.probability || 0) / 100), 0);
    return { totalValue, potentialValue };
  };

  // Create columns for each stage, but filter leads based on status
  const columns: KanbanColumn[] = [];
  
  // Add detailed open stages (all stages except Won/Lost)
  const openStages = stages.filter(stage => 
    !stage.isWonStage && !stage.isLostStage
  ).sort((a, b) => a.order - b.order);

  // Get all valid stage IDs
  const validStageIds = new Set(stages.map(s => s.id));

  openStages.forEach((stage, index) => {
    // RÈGLE IMPORTANTE : Un lead fermé ne peut PAS conserver son stage d'origine
    // Seuls les leads avec des statuts "ouverts" peuvent rester dans leur stage d'origine
    
    // CRITICAL: Un lead ne peut apparaître que dans UNE seule colonne
    // On utilise uniquement le stageId pour déterminer dans quelle colonne afficher le lead
    // Le statut est utilisé uniquement pour valider que le lead peut être dans cette colonne
    const stageLeads = leads.filter(lead => {
      // Exclude Won/Lost leads from normal stages
      if (lead.status === 'Won' || lead.status === 'Lost') {
        return false;
      }
      
      // Un lead apparaît dans une colonne UNIQUEMENT s'il est dans cette étape (stageId)
      const isInThisStage = lead.stageId === stage.id;
      if (!isInThisStage) {
        return false;
      }
      
      // Vérifier que le statut est compatible avec cette étape
      // Statuts ouverts: Open et Qualified (aligné avec le backend)
      const hasOpenStatus = lead.status === 'Open' || lead.status === 'Qualified' || lead.status === 'InProgress';
      return hasOpenStatus;
    });
    
    
    const metrics = calculateColumnMetrics(stageLeads);
    
    columns.push({
      id: stage.id,
      name: stage.name,
      description: stage.description || '',
      color: stage.color || '#3B82F6',
      order: index + 1,
      isActive: true,
      isWonStage: false,
      isLostStage: false,
      leadCount: stageLeads.length,
      totalValue: metrics.totalValue,
      potentialValue: metrics.potentialValue,
      averageTimeInStageDays: 0,
    });
  });


  // Add Won and Lost stages from the database
  const wonStages = stages.filter(stage => stage.isWonStage);
  const lostStages = stages.filter(stage => stage.isLostStage);
  
  // Add Won stages
  wonStages.forEach((stage, index) => {
    // RÈGLE IMPORTANTE : Un lead fermé ne peut PAS conserver son stage d'origine
    // Pour les colonnes Won, montrer TOUS les leads avec status 'Won'
    // Peu importe leur stageId d'origine, ils sont maintenant dans le stage Won
    const stageLeads = leads.filter(lead => lead.status === 'Won');
    const metrics = calculateColumnMetrics(stageLeads);
    
    columns.push({
      id: stage.id,
      name: stage.name,
      description: stage.description || 'Leads gagnés',
      color: stage.color || '#10B981',
      order: openStages.length + index + 1,
      isActive: true,
      isWonStage: true,
      isLostStage: false,
      leadCount: stageLeads.length,
      totalValue: metrics.totalValue,
      potentialValue: metrics.potentialValue,
      averageTimeInStageDays: 0,
    });
  });
  
  // Add Lost stages
  lostStages.forEach((stage, index) => {
    // RÈGLE IMPORTANTE : Un lead fermé ne peut PAS conserver son stage d'origine
    // Pour les colonnes Lost, montrer TOUS les leads avec status 'Lost'
    // Peu importe leur stageId d'origine, ils sont maintenant dans le stage Lost
    const stageLeads = leads.filter(lead => lead.status === 'Lost');
    const metrics = calculateColumnMetrics(stageLeads);
    
    columns.push({
      id: stage.id,
      name: stage.name,
      description: stage.description || 'Leads perdus',
      color: stage.color || '#EF4444',
      order: openStages.length + wonStages.length + index + 1,
      isActive: true,
      isWonStage: false,
      isLostStage: true,
      leadCount: stageLeads.length,
      totalValue: metrics.totalValue,
      potentialValue: metrics.potentialValue,
      averageTimeInStageDays: 0,
    });
  });

  // Final columns created
  
  return columns;
};

export const transformStatsToKanbanMetrics = (stats: LeadStats & { lostLeads?: number }): KanbanMetrics => ({
  totalLeads: stats.totalLeads,
  openLeads: stats.openLeads,
  qualifiedLeads: stats.qualifiedLeads,
  wonLeads: stats.wonLeads,
  lostLeads: stats.lostLeads ?? 0, // Calculé dans KanbanBoard
  totalValue: stats.totalValue,
  wonValue: 0, // Not available in LeadStats
  potentialValue: stats.totalValue * 0.7, // Estimate if not available
  overallConversionRate: stats.conversionRate,
  averageDealSize: stats.averageValue,
  averageSalesCycle: 0, // Calculate if needed
  leadCountByStage: {}, // Calculate from leads if needed
  valueByStage: {}, // Calculate from leads if needed
  conversionRatesByStage: {}, // Calculate from leads if needed
  averageTimeByStage: {}, // Calculate from leads if needed
});

// API Functions
const kanbanApi = {
  getBoard: async (): Promise<KanbanBoard> => {
    // Use the same data source as the table view - bypass Kanban API
    const [leadsResponse, stagesResponse, statsResponse] = await Promise.all([
      leadsApi.getLeads({ pageSize: 1000, sortBy: 'createdAt', sortDirection: 'desc' }), // Same sorting as table
      stagesApi.getStages(),
      leadsApi.getLeadStats()
    ]);
    
    console.log('=== KANBAN API RESPONSE ===');
    console.log('Total leads from API:', leadsResponse.totalCount);
    console.log('Leads received:', leadsResponse.data?.length);
    console.log('PageSize requested: 1000');
    console.log('Full response:', leadsResponse);
    
    const leads = leadsResponse.data;
    const stages = stagesResponse;
    const stats = statsResponse;
    
    // Transform leads to Kanban format
    const kanbanLeads = leads.map(lead => transformLeadToKanbanLead(lead));
    
    // Create detailed columns based on stage names but grouped by status
    const kanbanColumns = createVirtualColumns(leads, stages);
    
    // Transform stats to Kanban metrics
    const kanbanMetrics = transformStatsToKanbanMetrics(stats);
    
    return {
      columns: kanbanColumns,
      leads: kanbanLeads,
      metrics: kanbanMetrics
    };
  },

  getStages: async (): Promise<KanbanColumn[]> => {
    const [leadsResponse, stagesResponse] = await Promise.all([
      leadsApi.getLeads({ pageSize: 1000, sortBy: 'createdAt', sortDirection: 'desc' }),
      stagesApi.getStages()
    ]);
    
    const leads = leadsResponse.data;
    const stages = stagesResponse;
    
    return createVirtualColumns(leads, stages);
  },

  getMetrics: async (): Promise<KanbanMetrics> => {
    const stats = await leadsApi.getLeadStats();
    return transformStatsToKanbanMetrics(stats);
  },

  moveLead: async (request: MoveLeadRequest): Promise<KanbanLead> => {
    // First, get the current lead to preserve all required fields
    const currentLead = await leadsApi.getLead(request.leadId);
    
    // Get available stages to validate the target
    const stages = await stagesApi.getStages();
    const validStageIds = new Set(stages.map(s => s.id));
    
    // Determine the new status and stage based on the target column
    let newStatus: string;
    let newStageId: string = request.toStageId;
    
    // Find the target stage to determine its type
    const targetStage = stages.find(s => s.id === request.toStageId);
    
    if (targetStage?.isWonStage) {
      newStatus = 'Won';
      // Set stageId to the Won stage ID so the lead appears in the Won column
      newStageId = request.toStageId;
    } else if (targetStage?.isLostStage) {
      newStatus = 'Lost';
      // Set stageId to the Lost stage ID so the lead appears in the Lost column
      newStageId = request.toStageId;
    } else {
      // For detailed stages (Nouveau, Qualifié, Proposition, Négociation)
      // Validate that the target stage exists
      if (!validStageIds.has(request.toStageId)) {
        console.error('❌ [MOVE LEAD] Invalid stageId provided:', request.toStageId);
        throw new Error(`Invalid stage ID: ${request.toStageId}`);
      }
      
      // If moving from Won/Lost to a normal stage, set to Open
      // Otherwise, preserve the current status (Open/Qualified)
      const currentStatus = currentLead.status;
      if (currentStatus === 'Won' || currentStatus === 'Lost') {
        newStatus = 'Open';
      } else {
        // Preserve Open/Qualified status when moving between normal stages
        newStatus = currentStatus || 'Open';
      }
    }
    
    // Build update data - only include valid fields to avoid 400 errors
    const updateData: any = {
      title: currentLead.title || 'Untitled Lead', // Required, ensure it's never empty
      stageId: newStageId, // Required
      status: newStatus, // Include status explicitly
    };
    
    // Only include optional fields if they have valid values
    if (currentLead.firstName) updateData.firstName = currentLead.firstName;
    if (currentLead.lastName) updateData.lastName = currentLead.lastName;
    
    // Email: only include if it's a valid email format
    if (currentLead.email && currentLead.email.includes('@')) {
      updateData.email = currentLead.email;
    }
    
    // PhoneNumber: only include if it matches Canadian format
    if (currentLead.phoneNumber) {
      const phoneRegex = /^\+?1\d{10}$/;
      if (phoneRegex.test(currentLead.phoneNumber)) {
        updateData.phoneNumber = currentLead.phoneNumber;
      }
      // If it doesn't match, don't include it (backend will keep existing value)
    }
    
    // Website: only include if it's a valid URL
    if (currentLead.website) {
      try {
        new URL(currentLead.website);
        updateData.website = currentLead.website;
      } catch {
        // Invalid URL, don't include it
      }
    }
    
    if (currentLead.company) updateData.company = currentLead.company;
    if (currentLead.jobTitle) updateData.jobTitle = currentLead.jobTitle;
    if (currentLead.estimatedValue !== undefined && currentLead.estimatedValue !== null) {
      updateData.estimatedValue = currentLead.estimatedValue;
    }
    if (currentLead.probability !== undefined && currentLead.probability !== null) {
      // Ensure probability is between 0 and 100
      updateData.probability = Math.max(0, Math.min(100, currentLead.probability));
    }
    if (currentLead.expectedCloseDate) updateData.expectedCloseDate = currentLead.expectedCloseDate;
    if (currentLead.notes) updateData.notes = currentLead.notes;
    if (currentLead.source) updateData.source = currentLead.source;
    
    try {
      const updatedLead = await leadsApi.updateLead(request.leadId, updateData);
      return transformLeadToKanbanLead(updatedLead);
    } catch (error: any) {
      console.error('❌ [MOVE LEAD] Update failed:', error);
      // Log the actual error response for debugging
      if (error.response?.data) {
        console.error('❌ [MOVE LEAD] Error details:', error.response.data);
      }
      throw error;
    }
  },

  updateLead: async (request: UpdateKanbanLeadRequest): Promise<KanbanLead> => {
    // Update the lead using the leads API
    const updateData: any = {};
    
    if (request.title !== undefined) updateData.title = request.title;
    if (request.estimatedValue !== undefined) updateData.estimatedValue = request.estimatedValue;
    if (request.probability !== undefined) updateData.probability = request.probability;
    if (request.expectedCloseDate !== undefined) updateData.expectedCloseDate = request.expectedCloseDate;
    // assignedUserId not available in Lead type
    
    const updatedLead = await leadsApi.updateLead(request.leadId, updateData);
    return transformLeadToKanbanLead(updatedLead);
  },

  createStage: async (request: CreateStageRequest): Promise<KanbanColumn> => {
    const response = await apiClient.post('/api/kanban/stages', request);
    return response.data;
  },

  updateStage: async (request: UpdateStageRequest): Promise<KanbanColumn> => {
    const response = await apiClient.put('/api/kanban/stages', request);
    return response.data;
  },

  deleteStage: async (stageId: string): Promise<void> => {
    await apiClient.delete(`/api/kanban/stages/${stageId}`);
  },

  reorderStages: async (stageIds: string[]): Promise<void> => {
    await apiClient.post('/api/kanban/stages/reorder', { stageIds });
  },
};

// Hooks
export const useKanbanBoard = () => {
  return useQuery({
    queryKey: kanbanKeys.board(),
    queryFn: kanbanApi.getBoard,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useKanbanStages = () => {
  return useQuery({
    queryKey: kanbanKeys.stages(),
    queryFn: kanbanApi.getStages,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useKanbanMetrics = () => {
  return useQuery({
    queryKey: kanbanKeys.metrics(),
    queryFn: kanbanApi.getMetrics,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useMoveLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kanbanApi.moveLead,
    onSuccess: async (updatedKanbanLead) => {
      // Récupérer le lead complet depuis l'API pour avoir toutes les données
      try {
        const updatedLead = await leadsApi.getLead(updatedKanbanLead.id);
        
        // Mise à jour optimiste dans toutes les listes de leads
        queryClient.setQueriesData(
          { queryKey: ['leads', 'list'] },
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((lead: Lead) => 
                lead.id === updatedLead.id ? updatedLead : lead
              ),
            };
          }
        );
        
        // Mettre à jour aussi le cache du lead individuel
        queryClient.setQueryData(['leads', 'detail', updatedLead.id], updatedLead);
      } catch (error) {
        console.error('Error fetching updated lead:', error);
      }
      
      // Invalidate and immediately refetch all related queries to refresh UI in real-time
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.metrics(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['leads'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['leads', 'list'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['leads', 'stats'], refetchType: 'active' });
      
      // Force immediate refetch of active queries
      queryClient.refetchQueries({ queryKey: ['leads', 'list'] });
      queryClient.refetchQueries({ queryKey: ['leads', 'stats'] });
    },
    onError: (error) => {
      console.error('Error moving lead:', error);
      toast.error('Erreur lors du déplacement du lead');
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kanbanApi.updateLead,
    onSuccess: () => {
      // Invalidate both Kanban and Leads data since they now use the same source
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      console.error('Error updating lead:', error);
    },
  });
};

export const useCreateStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kanbanApi.createStage,
    onSuccess: () => {
      // Invalidate stages and board data
      queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
    },
    onError: (error) => {
      console.error('Error creating stage:', error);
    },
  });
};

export const useUpdateStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kanbanApi.updateStage,
    onSuccess: () => {
      // Invalidate stages and board data
      queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
    },
    onError: (error) => {
      console.error('Error updating stage:', error);
    },
  });
};

export const useDeleteStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kanbanApi.deleteStage,
    onSuccess: () => {
      // Invalidate stages and board data
      queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
    },
    onError: (error) => {
      console.error('Error deleting stage:', error);
    },
  });
};

export const useReorderStages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kanbanApi.reorderStages,
    onSuccess: () => {
      // Invalidate stages and board data
      queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
    },
    onError: (error) => {
      console.error('Error reordering stages:', error);
    },
  });
};

// Utility functions
export const getLeadsForStage = (leads: KanbanLead[], stageId: string): KanbanLead[] => {
  return leads.filter(lead => lead.stageId === stageId);
};

export const getStageById = (stages: KanbanColumn[], stageId: string): KanbanColumn | undefined => {
  return stages.find(stage => stage.id === stageId);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatDays = (days: number): string => {
  if (days < 1) return '< 1 jour';
  if (days === 1) return '1 jour';
  return `${Math.round(days)} jours`;
};
