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
  // Monday.com style additions
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  wipLimit?: number;
  isCollapsed?: boolean;
  showCount?: boolean;
  showValue?: boolean;
  showAverageTime?: boolean;
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
  // Monday.com style additions
  avatar?: string;
  initials?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  color?: string;
  isSelected?: boolean;
  lastActivity?: string;
  notes?: string;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  leads: KanbanLead[];
  metrics: KanbanMetrics;
  // Monday.com style additions
  swimLanes?: any; // Will be typed properly after swimlanes implementation
  viewType?: 'standard' | 'timeline' | 'workload';
  selectedLeads?: string[];
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
  // Monday.com style additions
  cardLayout?: 'compact' | 'detailed';
  swimLaneConfig?: any; // Will be typed properly after swimlanes implementation
  showAvatar?: boolean;
  showBadges?: boolean;
  showProgress?: boolean;
  showTimeline?: boolean;
  colorBarPosition?: 'left' | 'top' | 'right';
  columnResizeEnabled?: boolean;
  cardExpandable?: boolean;
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
  // Monday.com style additions
  priorityFilter?: ('high' | 'medium' | 'low')[];
  tagsFilter?: string[];
  stageFilter?: string[];
  statusFilter?: string[];
  quickFilters?: QuickFilter[];
}

export interface QuickFilter {
  id: string;
  label: string;
  active: boolean;
  color?: string;
  count?: number;
}

// Bulk Actions
export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  requiresConfirmation?: boolean;
  handler: (selectedLeadIds: string[]) => Promise<void> | void;
}

// Undo/Redo
export interface KanbanUndoState {
  action: string;
  timestamp: number;
  data: any;
}

export interface KanbanHistory {
  past: KanbanUndoState[];
  present: any;
  future: KanbanUndoState[];
}
