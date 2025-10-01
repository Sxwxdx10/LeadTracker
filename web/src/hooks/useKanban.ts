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

// Query Keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  board: () => [...kanbanKeys.all, 'board'] as const,
  stages: () => [...kanbanKeys.all, 'stages'] as const,
  metrics: () => [...kanbanKeys.all, 'metrics'] as const,
};

// Transformation functions
const transformLeadToKanbanLead = (lead: Lead): KanbanLead => {
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
const createVirtualColumns = (leads: Lead[], stages: any[]): KanbanColumn[] => {
  const calculateColumnMetrics = (leads: Lead[]) => {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
    const potentialValue = leads.reduce((sum, lead) => sum + ((lead.estimatedValue || 0) * (lead.probability || 0) / 100), 0);
    return { totalValue, potentialValue };
  };

  // Create columns for each stage, but filter leads based on status
  const columns: KanbanColumn[] = [];
  
  // Add detailed open stages (Nouveau, Qualifié, Proposition, Négociation)
  const openStages = stages.filter(stage => 
    stage.name === 'Nouveau' || 
    stage.name === 'Qualifié' || 
    stage.name === 'Proposition' || 
    stage.name === 'Négociation'
  ).sort((a, b) => a.order - b.order);

  openStages.forEach((stage, index) => {
    let stageLeads;
    
    if (stage.name === 'Nouveau') {
      // For Nouveau stage, show ALL leads with Open status regardless of their actual stage
      stageLeads = leads.filter(lead => 
        (lead.status === 'Open' || lead.status === 'InProgress' || lead.status === 'Qualified')
      );
      
      // Debug logging for Nouveau stage
      console.log('=== DEBUG NOUVEAU STAGE ===');
      console.log('All leads:', leads.map(l => ({ title: l.title, status: l.status, stageName: l.stage?.name })));
      console.log('Open leads for Nouveau:', stageLeads.map(l => ({ title: l.title, status: l.status, stageName: l.stage?.name })));
    } else {
      // For other stages, show leads that are in this stage AND have Open status
      stageLeads = leads.filter(lead => 
        lead.stageId === stage.id && 
        (lead.status === 'Open' || lead.status === 'InProgress' || lead.status === 'Qualified')
      );
    }
    
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

  // Add any leads with Open status that are in "Fermé" stages to the appropriate open stage
  const openLeadsInClosedStages = leads.filter(lead => 
    (lead.status === 'Open' || lead.status === 'InProgress' || lead.status === 'Qualified') &&
    (lead.stage?.name === 'Fermé - Gagné' || lead.stage?.name === 'Fermé - Perdu')
  );

  // Distribute these leads to the first available open stage (Nouveau)
  if (openLeadsInClosedStages.length > 0 && openStages.length > 0) {
    const nouveauStage = openStages[0]; // Nouveau stage
    const nouveauIndex = columns.findIndex(col => col.id === nouveauStage.id);
    
    if (nouveauIndex !== -1) {
      // Add these leads to the Nouveau stage
      const allNouveauLeads = [...leads.filter(lead => 
        lead.stageId === nouveauStage.id && 
        (lead.status === 'Open' || lead.status === 'InProgress' || lead.status === 'Qualified')
      ), ...openLeadsInClosedStages];
      
      const metrics = calculateColumnMetrics(allNouveauLeads);
      columns[nouveauIndex] = {
        ...columns[nouveauIndex],
        leadCount: allNouveauLeads.length,
        totalValue: metrics.totalValue,
        potentialValue: metrics.potentialValue,
      } as KanbanColumn;
    }
  }

  // Add Won and Lost columns
  const wonLeads = leads.filter(lead => lead.status === 'Won');
  const lostLeads = leads.filter(lead => lead.status === 'Lost');
  
  const wonMetrics = calculateColumnMetrics(wonLeads);
  const lostMetrics = calculateColumnMetrics(lostLeads);

  columns.push({
    id: 'won-group',
    name: 'Fermé - Gagné',
    description: 'Leads gagnés',
    color: '#10B981',
    order: openStages.length + 1,
    isActive: true,
    isWonStage: true,
    isLostStage: false,
    leadCount: wonLeads.length,
    totalValue: wonMetrics.totalValue,
    potentialValue: wonMetrics.potentialValue,
    averageTimeInStageDays: 0,
  });

  columns.push({
    id: 'lost-group',
    name: 'Fermé - Perdu',
    description: 'Leads perdus',
    color: '#EF4444',
    order: openStages.length + 2,
    isActive: true,
    isWonStage: false,
    isLostStage: true,
    leadCount: lostLeads.length,
    totalValue: lostMetrics.totalValue,
    potentialValue: lostMetrics.potentialValue,
    averageTimeInStageDays: 0,
  });

  return columns;
};

const transformStatsToKanbanMetrics = (stats: LeadStats): KanbanMetrics => ({
  totalLeads: stats.totalLeads,
  openLeads: stats.openLeads,
  qualifiedLeads: stats.qualifiedLeads,
  wonLeads: stats.wonLeads,
  lostLeads: 0, // Not available in LeadStats
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
      leadsApi.getLeads(),
      stagesApi.getStages(),
      leadsApi.getLeadStats()
    ]);
    
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
      leadsApi.getLeads(),
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
    // Determine the new status and stage based on the target column
    let newStatus: string;
    let newStageId: string = request.toStageId;
    
    if (request.toStageId === 'won-group') {
      newStatus = 'Won';
      // Keep the current stageId for Won leads
      const currentLead = await leadsApi.getLead(request.leadId);
      newStageId = currentLead.stageId;
    } else if (request.toStageId === 'lost-group') {
      newStatus = 'Lost';
      // Keep the current stageId for Lost leads
      const currentLead = await leadsApi.getLead(request.leadId);
      newStageId = currentLead.stageId;
    } else {
      // For detailed stages (Nouveau, Qualifié, Proposition, Négociation)
      // Set status to Open and update the stageId
      newStatus = 'Open';
    }
    
    // Update the lead's status and stage
    const updateData: any = {
      status: newStatus,
      stageId: newStageId
    };
    
    const updatedLead = await leadsApi.updateLead(request.leadId, updateData);
    return transformLeadToKanbanLead(updatedLead);
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
    onSuccess: () => {
      // Invalidate both Kanban and Leads data since they now use the same source
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      queryClient.invalidateQueries({ queryKey: kanbanKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      console.error('Error moving lead:', error);
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
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
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
