// Monday.com Style Views Types

export type ViewType = 'kanban' | 'table' | 'timeline' | 'calendar';

export interface ViewConfig {
  id: string;
  name: string;
  type: ViewType;
  icon: string;
  description?: string;
}

export const VIEW_CONFIGS: ViewConfig[] = [
  {
    id: 'kanban',
    name: 'Kanban',
    type: 'kanban',
    icon: 'Squares2X2Icon',
    description: 'Visualize leads in a card-based workflow'
  },
  {
    id: 'table',
    name: 'Table',
    type: 'table',
    icon: 'TableCellsIcon',
    description: 'View leads in a detailed table format'
  },
  {
    id: 'timeline',
    name: 'Timeline',
    type: 'timeline',
    icon: 'ChartBarIcon',
    description: 'Timeline view with Gantt-style visualization'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    type: 'calendar',
    icon: 'CalendarIcon',
    description: 'Calendar view for scheduled activities'
  }
];

export interface ViewPreferences {
  currentView: ViewType;
  kanbanPreferences?: KanbanViewPreferences;
  tablePreferences?: TableViewPreferences;
  timelinePreferences?: TimelineViewPreferences;
  calendarPreferences?: CalendarViewPreferences;
}

export interface KanbanViewPreferences {
  swimLaneConfig: SwimLaneConfig;
  cardSize: 'small' | 'medium' | 'large';
  cardLayout: 'compact' | 'detailed';
  columnWidth: number;
  showMetrics: boolean;
  showCounts: boolean;
  colorScheme: 'default' | 'colorful' | 'minimal' | 'dark';
}

export interface TableViewPreferences {
  columns: TableColumnConfig[];
  visibleColumns: string[];
  grouping?: TableGroupingConfig;
  sortColumns: TableSortConfig[];
  rowHeight: 'compact' | 'normal' | 'comfortable';
  showRowNumbers: boolean;
  autoSave: boolean;
}

export interface TimelineViewPreferences {
  timeScale: 'day' | 'week' | 'month' | 'quarter';
  startDate?: string;
  endDate?: string;
  grouping?: 'assignee' | 'stage' | 'none';
  showDependencies: boolean;
  showMilestones: boolean;
  zoomLevel: number;
}

export interface CalendarViewPreferences {
  viewMode: 'month' | 'week' | 'day' | 'agenda';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showWeekends: boolean;
  timezone?: string;
}

// Table View specific types
export type TableColumnType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'person' 
  | 'status' 
  | 'tags' 
  | 'progress' 
  | 'rating'
  | 'boolean';

export interface TableColumnConfig {
  id: string;
  label: string;
  type: TableColumnType;
  field: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable: boolean;
  sortable: boolean;
  filterable: boolean;
  editable: boolean;
  visible: boolean;
  pinned?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface TableSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableGroupingConfig {
  enabled: boolean;
  field: string;
  collapseByDefault: boolean;
  sortGroups: boolean;
}

// Saved Views
export interface SavedView {
  id: string;
  name: string;
  viewType: ViewType;
  preferences: Partial<ViewPreferences>;
  filters: any;
  isFavorite: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Reference to swim lanes (import from swimlanes.ts)
import type { SwimLaneConfig } from './swimlanes';

