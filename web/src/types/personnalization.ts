// Monday.com Style Personalization Types

export type ColorScheme = 'default' | 'colorful' | 'minimal' | 'dark';
export type CardLayout = 'compact' | 'detailed';
export type CardSize = 'small' | 'medium' | 'large';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeConfig {
  name: string;
  colorScheme: ColorScheme;
  palette: ColorPalette;
}

export interface CardFieldVisibility {
  [key: string]: boolean;
}

export interface CardCustomization {
  size: CardSize;
  layout: CardLayout;
  showAvatar: boolean;
  showBadges: boolean;
  showProgress: boolean;
  showTimeline: boolean;
  showAssignedUser: boolean;
  showDueDate: boolean;
  showValue: boolean;
  showProbability: boolean;
  showCompany: boolean;
  showTasks: boolean;
  showLastContact: boolean;
  colorBarPosition: 'left' | 'top' | 'right';
  fieldOrder: string[];
  customFields: CardFieldVisibility;
}

export interface ColumnCustomization {
  columns: ColumnConfig[];
  collapsedColumns: string[];
  hiddenColumns: string[];
}

export interface ColumnConfig {
  id: string;
  name: string;
  color: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  wipLimit?: number;
  showCount: boolean;
  showValue: boolean;
  showAverageTime: boolean;
  sortable: boolean;
  resizable: boolean;
  collapsible: boolean;
}

export interface SwimLaneCustomization {
  type: 'assignee' | 'priority' | 'none';
  enabled: boolean;
  collapseByDefault: boolean;
  showMetrics: boolean;
  showTotals: boolean;
  priorityThresholds: {
    high: number; // min probability for high
    medium: number; // min probability for medium
    low: number; // min probability for low
  };
}

export interface ViewCustomization {
  card: CardCustomization;
  columns: ColumnCustomization;
  swimLanes: SwimLaneCustomization;
  theme: ThemeConfig;
}

export interface UserPreferences {
  userId: string;
  viewCustomization: ViewCustomization;
  defaultView: 'kanban' | 'table' | 'timeline' | 'calendar';
  defaultFilters: any;
  savedViews: string[];
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  keyboardShortcuts: KeyboardShortcutPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  mobile: boolean;
  sound: boolean;
  categories: {
    leadUpdates: boolean;
    taskReminders: boolean;
    deadlineAlerts: boolean;
    mentions: boolean;
  };
}

export interface KeyboardShortcutPreferences {
  enabled: boolean;
  navigation: {
    next: string;
    previous: string;
    first: string;
    last: string;
  };
  actions: {
    edit: string;
    delete: string;
    duplicate: string;
    archive: string;
    save: string;
  };
  views: {
    kanban: string;
    table: string;
    timeline: string;
    calendar: string;
  };
}

// Display Options
export interface DisplayOptions {
  density: 'compact' | 'normal' | 'comfortable';
  fontSize: 'small' | 'medium' | 'large';
  colorBlindMode: boolean;
  animations: boolean;
  transitions: boolean;
}

// Color Definitions for Status/Priority
export interface ColorMapping {
  status: Record<string, string>;
  priority: Record<string, string>;
  stages: Record<string, string>;
}

export const DEFAULT_COLOR_MAPPINGS: ColorMapping = {
  status: {
    Open: '#3B82F6',
    InProgress: '#F59E0B',
    Qualified: '#10B981',
    Unqualified: '#6B7280',
    Won: '#10B981',
    Lost: '#EF4444'
  },
  priority: {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#3B82F6'
  },
  stages: {
    default: '#3B82F6'
  }
};

