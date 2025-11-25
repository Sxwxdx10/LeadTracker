import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeadQueryParams, Lead, Stage } from '@/types/lead';
import { mapStageFilterToKanbanLogic } from '@/utils/kanbanFilterUtils';

export interface FilterState {
  searchTerm: string;
  stageIds: string[];
  ownerIds: string[];
  statuses: string[];
  companies: string[];
  dateRange: {
    from?: string | undefined;
    to?: string | undefined;
  };
  valueRange: {
    min?: number | undefined;
    max?: number | undefined;
  };
  probabilityRange: {
    min?: number | undefined;
    max?: number | undefined;
  };
}

export interface SavedFilter {
  id: string;
  name: string;
  isFavorite: boolean;
  usageCount: number;
  filters: FilterState;
  createdAt: string;
  updatedAt: string;
}

const defaultFilterState: FilterState = {
  searchTerm: '',
  stageIds: [],
  ownerIds: [],
  statuses: [],
  companies: [],
  dateRange: {},
  valueRange: {},
  probabilityRange: {},
};

export function useFilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: FilterState = {
      searchTerm: searchParams.get('search') || '',
      stageIds: searchParams.get('stages')?.split(',').filter(Boolean) || [],
      ownerIds: searchParams.get('owners')?.split(',').filter(Boolean) || [],
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) || [],
      companies: searchParams.get('companies')?.split(',').filter(Boolean) || [],
      dateRange: {
        from: searchParams.get('dateFrom') ?? undefined,
        to: searchParams.get('dateTo') ?? undefined,
      },
      valueRange: {
        min: searchParams.get('valueMin') ? Number(searchParams.get('valueMin')) : undefined,
        max: searchParams.get('valueMax') ? Number(searchParams.get('valueMax')) : undefined,
      },
      probabilityRange: {
        min: searchParams.get('probMin') ? Number(searchParams.get('probMin')) : undefined,
        max: searchParams.get('probMax') ? Number(searchParams.get('probMax')) : undefined,
      },
    };
    
    setFilters(urlFilters);
  }, [searchParams]);

  // Convert filters to LeadQueryParams
  const toQueryParams = useCallback((filterState: FilterState): LeadQueryParams => {
    const params: LeadQueryParams = {};
    
    // Only add search term if it's not empty
    if (filterState.searchTerm?.trim()) {
      params.searchTerm = filterState.searchTerm.trim();
    }
    
    // Only add stageId if we have at least one valid stage (take the first one)
    if (filterState.stageIds.length > 0 && filterState.stageIds[0]) {
      params.stageId = filterState.stageIds[0];
    }
    
    // Only add assignedUserId if we have at least one valid owner (take the first one)
    if (filterState.ownerIds.length > 0 && filterState.ownerIds[0]) {
      params.assignedUserId = filterState.ownerIds[0];
    }
    
    // Only add status if we have at least one valid status (take the first one)
    if (filterState.statuses.length > 0 && filterState.statuses[0]) {
      params.status = filterState.statuses[0];
    }
    
    // Add date filters if they exist
    if (filterState.dateRange.from) {
      params.createdFrom = filterState.dateRange.from;
    }
    if (filterState.dateRange.to) {
      params.createdTo = filterState.dateRange.to;
    }
    
    return params;
  }, []);

  // Update URL with current filters
  const updateURL = useCallback((filterState: FilterState) => {
    const params = new URLSearchParams();
    
    if (filterState.searchTerm) params.set('search', filterState.searchTerm);
    if (filterState.stageIds.length) params.set('stages', filterState.stageIds.join(','));
    if (filterState.ownerIds.length) params.set('owners', filterState.ownerIds.join(','));
    if (filterState.statuses.length) params.set('statuses', filterState.statuses.join(','));
    if (filterState.companies.length) params.set('companies', filterState.companies.join(','));
    if (filterState.dateRange.from) params.set('dateFrom', filterState.dateRange.from);
    if (filterState.dateRange.to) params.set('dateTo', filterState.dateRange.to);
    if (filterState.valueRange.min !== undefined) params.set('valueMin', filterState.valueRange.min.toString());
    if (filterState.valueRange.max !== undefined) params.set('valueMax', filterState.valueRange.max.toString());
    if (filterState.probabilityRange.min !== undefined) params.set('probMin', filterState.probabilityRange.min.toString());
    if (filterState.probabilityRange.max !== undefined) params.set('probMax', filterState.probabilityRange.max.toString());

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Apply filters (update URL and close panel)
  const applyFilters = useCallback(() => {
    updateURL(filters);
    setIsOpen(false);
    setHasUnsavedChanges(false);
  }, [filters, updateURL]);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(defaultFilterState);
    setHasUnsavedChanges(true);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilterState);
    updateURL(defaultFilterState);
    setIsOpen(false);
    setHasUnsavedChanges(false);
  }, [updateURL]);

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Add a filter value (for multi-select filters)
  const addFilterValue = useCallback(<K extends keyof FilterState>(
    key: K,
    value: string
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      if (Array.isArray(currentArray) && !currentArray.includes(value)) {
        return { ...prev, [key]: [...currentArray, value] };
      }
      return prev;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Remove a filter value (for multi-select filters)
  const removeFilterValue = useCallback(<K extends keyof FilterState>(
    key: K,
    value: string
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[] | undefined;
      if (Array.isArray(currentArray) && currentArray.length > 0) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      }
      return prev;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Load a saved filter
  const loadSavedFilter = useCallback((savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    setHasUnsavedChanges(true);
  }, []);

  // Check if filters are active (not default)
  const hasActiveFilters = useCallback(() => {
    return (
      filters.searchTerm !== '' ||
      (filters.stageIds?.length || 0) > 0 ||
      (filters.ownerIds?.length || 0) > 0 ||
      (filters.statuses?.length || 0) > 0 ||
      (filters.companies?.length || 0) > 0 ||
      filters.dateRange?.from ||
      filters.dateRange?.to ||
      filters.valueRange?.min !== undefined ||
      filters.valueRange?.max !== undefined ||
      filters.probabilityRange?.min !== undefined ||
      filters.probabilityRange?.max !== undefined
    );
  }, [filters]);

  // Get count of active filters
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.stageIds?.length) count++;
    if (filters.ownerIds?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.companies?.length) count++;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.valueRange?.min !== undefined || filters.valueRange?.max !== undefined) count++;
    if (filters.probabilityRange?.min !== undefined || filters.probabilityRange?.max !== undefined) count++;
    return count;
  }, [filters]);

  // Apply client-side filtering with Kanban logic
  // Only applies filters that are NOT already handled by the API server-side
  const applyClientSideFilters = useCallback((
    leads: Lead[], 
    stages: Stage[], 
    filterState: FilterState
  ): Lead[] => {
    let filteredLeads = leads;
    
    // Apply stage filtering with Kanban logic (only if multiple stages or complex logic)
    // If only one stage is selected, it's already filtered server-side
    if (filterState.stageIds.length > 1) {
      filteredLeads = mapStageFilterToKanbanLogic(filterState.stageIds, stages, filteredLeads);
    } else if (filterState.stageIds.length === 1) {
      // Single stage - already filtered server-side, but apply Kanban logic for edge cases
      filteredLeads = mapStageFilterToKanbanLogic(filterState.stageIds, stages, filteredLeads);
    }
    
    // Apply filters that are NOT supported by the API:
    // - Multiple owners (API only supports one)
    if (filterState.ownerIds.length > 1) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.assignedUserId && filterState.ownerIds.includes(lead.assignedUserId)
      );
    }
    
    // - Multiple statuses (API only supports one)
    if (filterState.statuses.length > 1) {
      filteredLeads = filteredLeads.filter(lead => 
        filterState.statuses.includes(lead.status)
      );
    }
    
    // - Companies filter (not supported by API)
    if (filterState.companies.length > 0) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.company && filterState.companies.includes(lead.company)
      );
    }
    
    // - Value range (not supported by API)
    if (filterState.valueRange.min !== undefined || filterState.valueRange.max !== undefined) {
      filteredLeads = filteredLeads.filter(lead => {
        const value = lead.estimatedValue || 0;
        if (filterState.valueRange.min !== undefined && value < filterState.valueRange.min) {
          return false;
        }
        if (filterState.valueRange.max !== undefined && value > filterState.valueRange.max) {
          return false;
        }
        return true;
      });
    }
    
    // - Probability range (not supported by API)
    if (filterState.probabilityRange.min !== undefined || filterState.probabilityRange.max !== undefined) {
      filteredLeads = filteredLeads.filter(lead => {
        const prob = lead.probability || 0;
        if (filterState.probabilityRange.min !== undefined && prob < filterState.probabilityRange.min) {
          return false;
        }
        if (filterState.probabilityRange.max !== undefined && prob > filterState.probabilityRange.max) {
          return false;
        }
        return true;
      });
    }
    
    // Note: searchTerm, single stageId, single assignedUserId, single status, and dates
    // are already filtered server-side, so we don't re-filter them here
    
    return filteredLeads;
  }, []);

  return {
    // State
    isOpen,
    filters,
    hasUnsavedChanges,
    
    // Actions
    openPanel: () => setIsOpen(true),
    closePanel: () => setIsOpen(false),
    togglePanel: () => setIsOpen(prev => !prev),
    
    // Filter management
    updateFilter,
    addFilterValue,
    removeFilterValue,
    applyFilters,
    resetFilters,
    clearFilters,
    loadSavedFilter,
    
    // Utilities
    toQueryParams: () => toQueryParams(filters),
    hasActiveFilters: hasActiveFilters(),
    getActiveFiltersCount: getActiveFiltersCount(),
    applyClientSideFilters,
  };
}
