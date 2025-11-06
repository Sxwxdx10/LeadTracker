import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewType, ViewPreferences } from '@/types/views';

interface ViewStore {
  currentView: ViewType;
  preferences: Partial<ViewPreferences>;
  setCurrentView: (view: ViewType) => void;
  updatePreferences: (preferences: Partial<ViewPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: Partial<ViewPreferences> = {
  kanbanPreferences: {
    swimLaneConfig: {
      type: 'none',
      enabled: false,
      order: 0,
      collapseByDefault: false
    },
    cardSize: 'medium',
    cardLayout: 'detailed',
    columnWidth: 320,
    showMetrics: true,
    showCounts: true,
    colorScheme: 'default'
  },
  tablePreferences: {
    columns: [],
    visibleColumns: [],
    sortColumns: [],
    rowHeight: 'normal',
    showRowNumbers: false,
    autoSave: true
  }
};

export const useViewStore = create<ViewStore>()(
  persist(
    (set) => ({
      currentView: 'kanban',
      preferences: defaultPreferences,
      setCurrentView: (view) => set({ currentView: view }),
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        })),
      resetPreferences: () => set({ preferences: defaultPreferences })
    }),
    {
      name: 'leadtracker-view-store',
      partialize: (state) => ({
        currentView: state.currentView,
        preferences: state.preferences
      })
    }
  )
);

