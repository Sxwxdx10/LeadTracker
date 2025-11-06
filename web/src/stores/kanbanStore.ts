import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KanbanCustomization } from '@/types/kanban';
import { SwimLaneType } from '@/types/swimlanes';

interface KanbanStore {
  customization: Partial<KanbanCustomization>;
  swimLaneType: SwimLaneType;
  selectedLeads: string[];
  collapsedLanes: string[];
  filters: any;
  isMultiSelectMode: boolean;
  
  // Actions
  setCustomization: (customization: Partial<KanbanCustomization>) => void;
  setSwimLaneType: (type: SwimLaneType) => void;
  toggleLeadSelection: (leadId: string) => void;
  clearSelections: () => void;
  selectAll: (leadIds: string[]) => void;
  toggleLaneCollapse: (laneId: string) => void;
  setFilters: (filters: any) => void;
  setMultiSelectMode: (enabled: boolean) => void;
  selectMultiple: (leadIds: string[]) => void;
}

const defaultCustomization: Partial<KanbanCustomization> = {
  showMetrics: true,
  showTaskCount: true,
  showOverdue: true,
  showAssignedUser: true,
  cardSize: 'medium',
  colorScheme: 'default',
  columnWidth: 320,
  maxLeadsPerColumn: 50,
  cardLayout: 'detailed',
  showAvatar: true,
  showBadges: true,
  showProgress: true,
  showTimeline: true,
  colorBarPosition: 'left',
  columnResizeEnabled: true,
  cardExpandable: true
};

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      customization: defaultCustomization,
      swimLaneType: 'none',
      selectedLeads: [],
      collapsedLanes: [],
      filters: {},
      isMultiSelectMode: false,

      setCustomization: (customization) =>
        set((state) => ({
          customization: { ...state.customization, ...customization }
        })),

      setSwimLaneType: (type) => set({ swimLaneType: type }),

      toggleLeadSelection: (leadId) =>
        set((state) => ({
          selectedLeads: state.selectedLeads.includes(leadId)
            ? state.selectedLeads.filter(id => id !== leadId)
            : [...state.selectedLeads, leadId]
        })),

      clearSelections: () => set({ selectedLeads: [] }),

      selectAll: (leadIds) => set({ selectedLeads: leadIds }),

      toggleLaneCollapse: (laneId) =>
        set((state) => ({
          collapsedLanes: state.collapsedLanes.includes(laneId)
            ? state.collapsedLanes.filter(id => id !== laneId)
            : [...state.collapsedLanes, laneId]
        })),

      setFilters: (filters) => set({ filters }),

      setMultiSelectMode: (enabled) => set({ isMultiSelectMode: enabled }),

      selectMultiple: (leadIds) =>
        set((state) => ({
          selectedLeads: [...new Set([...state.selectedLeads, ...leadIds])]
        }))
    }),
    {
      name: 'leadtracker-kanban-store',
      partialize: (state) => ({
        customization: state.customization,
        swimLaneType: state.swimLaneType,
        collapsedLanes: state.collapsedLanes,
        filters: state.filters
      })
    }
  )
);

