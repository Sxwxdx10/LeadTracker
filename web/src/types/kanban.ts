// Kanban Types
export interface KanbanColumn {
  id: string;
  name: string;
  description?: string;
  color: string;
  order: number;
  isActive: boolean;
  isWonStage: boolean;
  isLostStage: boolean;
  leadCount: number;
  totalValue: number;
  potentialValue: number;
  averageTimeInStageDays: number; // in days
}

export interface KanbanLead {
  id: string;
  title: string;
  contactName?: string;
  company?: string;
  email?: string;
  phoneNumber?: string;
  estimatedValue?: number;
  probability: number;
  expectedCloseDate?: string;
  lastContactedAt?: string;
  status: string;
  stageId: string;
  stageName?: string | undefined;
  stage?: {
    id: string;
    name: string;
  } | undefined;
  assignedUserId?: string;
  assignedUserName?: string;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  stageEnteredAt: string;
  isOverdue: boolean;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  leads: KanbanLead[];
  metrics: KanbanMetrics;
}

export interface KanbanMetrics {
  totalLeads: number;
  openLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  lostLeads: number;
  totalValue: number;
  wonValue: number;
  potentialValue: number;
  overallConversionRate: number;
  averageDealSize: number;
  averageSalesCycle?: number;
  leadCountByStage?: Record<string, number>;
  valueByStage?: Record<string, number>;
  conversionRatesByStage?: Record<string, number>;
  averageTimeByStage?: Record<string, number>;
}

// API Request/Response Types
export interface MoveLeadRequest {
  leadId: string;
  toStageId: string;
  newPosition: number;
}

export interface UpdateKanbanLeadRequest {
  leadId: string;
  title?: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedUserId?: string;
}

export interface CreateStageRequest {
  name: string;
  description?: string;
  color: string;
  isWonStage: boolean;
  isLostStage: boolean;
}

export interface UpdateStageRequest {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  isWonStage: boolean;
  isLostStage: boolean;
}

// Drag and Drop Types
export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: {
        droppableId: string;
        index: number;
      };
    };
  };
  over: {
    id: string;
    data: {
      current: {
        droppableId: string;
        index: number;
      };
    };
  } | null;
}

// SignalR Event Types
export interface KanbanSignalREvents {
  LeadMoved: (lead: KanbanLead) => void;
  LeadUpdated: (lead: KanbanLead) => void;
  StageCreated: (stage: KanbanColumn) => void;
  StageUpdated: (stage: KanbanColumn) => void;
  StageDeleted: (stageId: string) => void;
  StagesReordered: (stages: KanbanColumn[]) => void;
  MetricsUpdated: (metrics: KanbanMetrics) => void;
}

// Customization Types
export interface KanbanCustomization {
  showMetrics: boolean;
  showTaskCount: boolean;
  showOverdue: boolean;
  showAssignedUser: boolean;
  cardSize: 'small' | 'medium' | 'large';
  colorScheme: 'default' | 'colorful' | 'minimal';
  columnWidth: number;
  maxLeadsPerColumn: number;
}

export interface KanbanFilters {
  searchTerm: string;
  assignedUserId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  probabilityRange?: {
    min: number;
    max: number;
  };
  showOverdueOnly: boolean;
}
