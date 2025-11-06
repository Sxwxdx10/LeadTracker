import { useState, useMemo, useCallback } from 'react';
import { KanbanLead, KanbanColumn } from '@/types/kanban';
import { SwimLaneType, SwimLaneData, SwimLaneConfig } from '@/types/swimlanes';
import { createSwimLaneGrouping, getLeadsForColumnInLane } from '@/utils/swimLaneGrouping';

export interface UseSwimLanesOptions {
  initialType?: SwimLaneType;
  collapseByDefault?: boolean;
}

export interface UseSwimLanesReturn {
  swimLaneType: SwimLaneType;
  setSwimLaneType: (type: SwimLaneType) => void;
  swimLanes: SwimLaneData[];
  toggleLaneCollapse: (laneId: string) => void;
  collapsedLanes: Set<string>;
  getLeadsForColumn: (columnId: string, laneId: string) => KanbanLead[];
  config: SwimLaneConfig;
}

export function useSwimLanes(
  leads: KanbanLead[],
  columns: KanbanColumn[],
  options: UseSwimLanesOptions = {}
): UseSwimLanesReturn {
  const { initialType = 'none', collapseByDefault = false } = options;
  
  const [swimLaneType, setSwimLaneType] = useState<SwimLaneType>(initialType);
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());

  // Create swim lanes based on type
  const swimLanes = useMemo(() => {
    if (swimLaneType === 'none') {
      return [];
    }
    
    const lanes = createSwimLaneGrouping(swimLaneType, leads, columns);
    
    // Apply collapsed state
    return lanes.map(lane => ({
      ...lane,
      group: {
        ...lane.group,
        isCollapsed: collapseByDefault || collapsedLanes.has(lane.group.id)
      }
    }));
  }, [swimLaneType, leads, columns, collapseByDefault, collapsedLanes]);

  const toggleLaneCollapse = useCallback((laneId: string) => {
    setCollapsedLanes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(laneId)) {
        newSet.delete(laneId);
      } else {
        newSet.add(laneId);
      }
      return newSet;
    });
  }, []);

  const getLeadsForColumn = useCallback((columnId: string, laneId: string): KanbanLead[] => {
    const lane = swimLanes.find(l => l.group.id === laneId);
    if (!lane) return [];
    
    return getLeadsForColumnInLane(leads, columnId, lane.leads);
  }, [swimLanes, leads]);

  const config: SwimLaneConfig = useMemo(() => ({
    type: swimLaneType,
    enabled: swimLaneType !== 'none',
    order: 0,
    collapseByDefault
  }), [swimLaneType, collapseByDefault]);

  return {
    swimLaneType,
    setSwimLaneType,
    swimLanes,
    toggleLaneCollapse,
    collapsedLanes,
    getLeadsForColumn,
    config
  };
}

