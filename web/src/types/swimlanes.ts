// Monday.com Style Swim Lanes Types

export type SwimLaneType = 'assignee' | 'priority' | 'status' | 'none';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface SwimLaneConfig {
  type: SwimLaneType;
  enabled: boolean;
  order: number;
  collapseByDefault?: boolean;
}

export interface SwimLaneGroup {
  id: string;
  name: string;
  label: string;
  color?: string;
  icon?: string;
  count: number;
  totalValue: number;
  potentialValue: number;
  averageProbability: number;
  isCollapsed: boolean;
}

export interface SwimLaneMetrics {
  totalCount: number;
  totalValue: number;
  potentialValue: number;
  averageProbability: number;
  completionRate?: number;
  averageTimeInLane?: number;
}

export interface SwimLaneData {
  group: SwimLaneGroup;
  leads: string[]; // Lead IDs in this lane
  metrics: SwimLaneMetrics;
}

export interface SwimLaneGrouping {
  type: SwimLaneType;
  groups: SwimLaneData[];
}

// For assignee grouping
export interface AssigneeGroup extends SwimLaneGroup {
  userId: string;
  userName: string;
  avatar?: string;
  initials?: string;
}

// For priority grouping
export interface PriorityGroup extends SwimLaneGroup {
  level: PriorityLevel;
  minProbability: number;
  maxProbability: number;
}

// For status grouping
export interface StatusGroup extends SwimLaneGroup {
  status: string;
}

// Priority calculation based on value and probability
export interface PriorityCalculation {
  level: PriorityLevel;
  score: number;
  factors: {
    value: number;
    probability: number;
    urgency: number; // Based on expectedCloseDate
    effort: number; // Based on task count or complexity
  };
}

