import { KanbanLead, KanbanColumn } from '@/types/kanban';
import { SwimLaneType, SwimLaneGrouping, SwimLaneData, AssigneeGroup, PriorityGroup, SwimLaneMetrics } from '@/types/swimlanes';
import { calculateGroupMetrics, calculatePriority } from '@/utils/cardUtils';

// Format percentage helper
const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Group leads by assignee
 */
export const groupByAssignee = (
  leads: KanbanLead[], 
  columns: KanbanColumn[]
): SwimLaneData[] => {
  const assigneeMap = new Map<string, KanbanLead[]>();
  
  leads.forEach(lead => {
    const assigneeId = lead.assignedUserId || 'unassigned';
    if (!assigneeMap.has(assigneeId)) {
      assigneeMap.set(assigneeId, []);
    }
    assigneeMap.get(assigneeId)!.push(lead);
  });

  const lanes: SwimLaneData[] = [];
  let order = 0;

  assigneeMap.forEach((leadList, assigneeId) => {
    const firstLead = leadList[0];
    const assigneeName = assigneeId === 'unassigned' 
      ? 'Non assigné' 
      : firstLead?.assignedUserName || 'Inconnu';
    
    const groupMetrics = calculateGroupMetrics(leadList);
    const metrics: SwimLaneMetrics = {
      ...groupMetrics,
      totalCount: leadList.length
    };
    
    lanes.push({
      group: {
        id: assigneeId,
        name: assigneeName,
        label: assigneeName,
        count: leadList.length,
        totalValue: metrics.totalValue,
        potentialValue: metrics.potentialValue,
        averageProbability: metrics.averageProbability,
        isCollapsed: false,
        color: '#3B82F6'
      },
      leads: leadList.map(l => l.id),
      metrics
    });
    
    order++;
  });

  return lanes;
};

/**
 * Group leads by priority
 */
export const groupByPriority = (
  leads: KanbanLead[],
  highThreshold: number = 70,
  mediumThreshold: number = 40
): SwimLaneData[] => {
  const priorityMap = new Map<'high' | 'medium' | 'low', KanbanLead[]>();
  
  leads.forEach(lead => {
    const priority = calculatePriority(lead);
    if (!priorityMap.has(priority)) {
      priorityMap.set(priority, []);
    }
    priorityMap.get(priority)!.push(lead);
  });

  const lanes: SwimLaneData[] = [];
  const priorityOrder = ['high', 'medium', 'low'] as const;
  
  priorityOrder.forEach((priority) => {
    const leadList = priorityMap.get(priority) || [];
    
    if (leadList.length > 0) {
      const groupMetrics = calculateGroupMetrics(leadList);
      const metrics: SwimLaneMetrics = {
        ...groupMetrics,
        totalCount: leadList.length
      };
      
      const priorityLabels = {
        high: 'Priorité Haute',
        medium: 'Priorité Moyenne',
        low: 'Priorité Basse'
      };
      
      const priorityColors = {
        high: '#EF4444',
        medium: '#F59E0B',
        low: '#3B82F6'
      };
      
      lanes.push({
        group: {
          id: `priority-${priority}`,
          name: priorityLabels[priority],
          label: priorityLabels[priority],
          count: leadList.length,
          totalValue: metrics.totalValue,
          potentialValue: metrics.potentialValue,
          averageProbability: metrics.averageProbability,
          isCollapsed: false,
          color: priorityColors[priority],
          icon: priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🔵'
        },
        leads: leadList.map(l => l.id),
        metrics
      });
    }
  });

  return lanes;
};

/**
 * Group leads by status
 */
export const groupByStatus = (
  leads: KanbanLead[]
): SwimLaneData[] => {
  const statusMap = new Map<string, KanbanLead[]>();
  
  leads.forEach(lead => {
    const status = lead.status;
    if (!statusMap.has(status)) {
      statusMap.set(status, []);
    }
    statusMap.get(status)!.push(lead);
  });

  const lanes: SwimLaneData[] = [];
  // Ordre des statuts aligné avec le backend: Open, Qualified, Won, Lost, Cancelled
  const statusOrder = ['Open', 'Qualified', 'Won', 'Lost', 'Cancelled'];
  
  statusOrder.forEach((status) => {
    const leadList = statusMap.get(status) || [];
    
    if (leadList.length > 0) {
      const groupMetrics = calculateGroupMetrics(leadList);
      const metrics: SwimLaneMetrics = {
        ...groupMetrics,
        totalCount: leadList.length
      };
      
      const statusLabels: Record<string, string> = {
        'Open': 'Ouverts',
        'Qualified': 'Qualifiés',
        'Won': 'Gagnés',
        'Lost': 'Perdus',
        'Cancelled': 'Annulés'
      };
      
      const statusColors: Record<string, string> = {
        'Open': '#3B82F6',
        'Qualified': '#10B981',
        'Won': '#10B981',
        'Lost': '#EF4444',
        'Cancelled': '#6B7280'
      };
      
      lanes.push({
        group: {
          id: `status-${status}`,
          name: statusLabels[status] || status,
          label: statusLabels[status] || status,
          count: leadList.length,
          totalValue: metrics.totalValue,
          potentialValue: metrics.potentialValue,
          averageProbability: metrics.averageProbability,
          isCollapsed: false,
          color: statusColors[status] || '#3B82F6'
        },
        leads: leadList.map(l => l.id),
        metrics
      });
    }
  });

  return lanes;
};

/**
 * Main function to create swim lane grouping
 */
export const createSwimLaneGrouping = (
  type: SwimLaneType,
  leads: KanbanLead[],
  columns?: KanbanColumn[]
): SwimLaneData[] => {
  switch (type) {
    case 'assignee':
      if (!columns) {
        console.warn('Columns needed for assignee grouping');
        return [];
      }
      return groupByAssignee(leads, columns);
    case 'priority':
      return groupByPriority(leads);
    case 'status':
      return groupByStatus(leads);
    case 'none':
    default:
      return [];
  }
};

/**
 * Filter leads for a specific column within a swim lane
 */
export const getLeadsForColumnInLane = (
  leads: KanbanLead[],
  columnId: string,
  laneLeadIds: string[]
): KanbanLead[] => {
  return leads.filter(lead => 
    laneLeadIds.includes(lead.id) && lead.stageId === columnId
  );
};

