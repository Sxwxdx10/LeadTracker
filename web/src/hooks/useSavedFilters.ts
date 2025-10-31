import { useState, useCallback } from 'react';
import { FilterState } from './useFilterPanel';

export interface SavedFilter {
  id: string;
  name: string;
  isFavorite: boolean;
  usageCount: number;
  filters: FilterState;
  createdAt: string;
  updatedAt: string;
}

// Mock API calls - replace with actual API integration
const mockApi = {
  getSavedFilters: async (): Promise<SavedFilter[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        name: 'Leads qualifiés',
        isFavorite: true,
        usageCount: 15,
        filters: {
          searchTerm: '',
          stageIds: ['stage-qualified'],
          ownerIds: [],
          statuses: ['Qualified'],
          companies: [],
          dateRange: {},
          valueRange: { min: 10000 },
          probabilityRange: { min: 50 },
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      },
      {
        id: '2',
        name: 'Mes leads actifs',
        isFavorite: false,
        usageCount: 8,
        filters: {
          searchTerm: '',
          stageIds: [],
          ownerIds: ['user-current'],
          statuses: ['Open', 'InProgress'],
          companies: [],
          dateRange: {},
          valueRange: {},
          probabilityRange: {},
        },
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
      },
      {
        id: '3',
        name: 'Deals à fort potentiel',
        isFavorite: true,
        usageCount: 12,
        filters: {
          searchTerm: '',
          stageIds: [],
          ownerIds: [],
          statuses: [],
          companies: [],
          dateRange: {},
          valueRange: { min: 50000 },
          probabilityRange: { min: 75 },
        },
        createdAt: '2024-01-05T11:30:00Z',
        updatedAt: '2024-01-22T13:20:00Z',
      },
    ];
  },

  saveFilter: async (name: string, filters: FilterState, isFavorite: boolean = false): Promise<SavedFilter> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      isFavorite,
      usageCount: 0,
      filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newFilter;
  },

  deleteFilter: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  updateFilterUsage: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  updateFilter: async (id: string, updates: Partial<SavedFilter>): Promise<SavedFilter> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock updated filter
    return {
      id,
      name: updates.name || 'Updated Filter',
      isFavorite: updates.isFavorite || false,
      usageCount: 0,
      filters: updates.filters || {
        searchTerm: '',
        stageIds: [],
        ownerIds: [],
        statuses: [],
        dateRange: {},
        valueRange: {},
        probabilityRange: {},
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };
  },
};

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved filters
  const loadSavedFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters = await mockApi.getSavedFilters();
      setSavedFilters(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des filtres');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a new filter
  const saveFilter = useCallback(async (
    name: string, 
    filters: FilterState, 
    isFavorite: boolean = false
  ): Promise<SavedFilter> => {
    try {
      setIsLoading(true);
      setError(null);
      const newFilter = await mockApi.saveFilter(name, filters, isFavorite);
      setSavedFilters(prev => [newFilter, ...prev]);
      return newFilter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a filter
  const deleteFilter = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await mockApi.deleteFilter(id);
      setSavedFilters(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update filter usage count
  const updateFilterUsage = useCallback(async (id: string) => {
    try {
      await mockApi.updateFilterUsage(id);
      setSavedFilters(prev => 
        prev.map(f => 
          f.id === id 
            ? { ...f, usageCount: f.usageCount + 1, updatedAt: new Date().toISOString() }
            : f
        )
      );
    } catch (err) {
      console.error('Error updating filter usage:', err);
    }
  }, []);

  // Update filter (rename, toggle favorite, etc.)
  const updateFilter = useCallback(async (
    id: string, 
    updates: Partial<SavedFilter>
  ): Promise<SavedFilter> => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedFilter = await mockApi.updateFilter(id, updates);
      setSavedFilters(prev => 
        prev.map(f => f.id === id ? updatedFilter : f)
      );
      return updatedFilter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    const filter = savedFilters.find(f => f.id === id);
    if (!filter) return;

    try {
      await updateFilter(id, { isFavorite: !filter.isFavorite });
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, [savedFilters, updateFilter]);

  // Get favorite filters
  const favoriteFilters = savedFilters.filter(f => f.isFavorite);

  // Get most used filters
  const mostUsedFilters = [...savedFilters]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  return {
    // State
    savedFilters,
    favoriteFilters,
    mostUsedFilters,
    isLoading,
    error,
    
    // Actions
    loadSavedFilters,
    saveFilter,
    deleteFilter,
    updateFilter,
    updateFilterUsage,
    toggleFavorite,
    
    // Utilities
    clearError: () => setError(null),
  };
}
