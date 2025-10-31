import React from 'react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { FilterPill } from '@/components/ui/FilterPill';
import { Button } from '@/components/ui/button';
import { FilterState } from '@/hooks/useFilterPanel';
import { cn } from '@/lib/utils';

export interface ActiveFiltersDisplayProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
  resultsCount?: number;
  className?: string;
}

export function ActiveFiltersDisplay({
  filters,
  onRemoveFilter,
  onClearAll,
  resultsCount,
  className,
}: ActiveFiltersDisplayProps) {
  const activeFilters = React.useMemo(() => {
    const filtersList: Array<{
      key: keyof FilterState;
      label: string;
      value: string;
      count?: number;
    }> = [];

    // Search term
    if (filters.searchTerm) {
      filtersList.push({
        key: 'searchTerm',
        label: 'Recherche',
        value: filters.searchTerm,
      });
    }

    // Stages
    if (filters.stageIds && filters.stageIds.length > 0) {
      filtersList.push({
        key: 'stageIds',
        label: filters.stageIds.length === 1 ? 'Étape' : 'Étapes',
        value: filters.stageIds.join(', '),
        count: filters.stageIds.length,
      });
    }

    // Owners
    if (filters.ownerIds && filters.ownerIds.length > 0) {
      filtersList.push({
        key: 'ownerIds',
        label: filters.ownerIds.length === 1 ? 'Propriétaire' : 'Propriétaires',
        value: filters.ownerIds.join(', '),
        count: filters.ownerIds.length,
      });
    }

    // Statuses
    if (filters.statuses && filters.statuses.length > 0) {
      filtersList.push({
        key: 'statuses',
        label: filters.statuses.length === 1 ? 'Statut' : 'Statuts',
        value: filters.statuses.join(', '),
        count: filters.statuses.length,
      });
    }

    // Companies
    if (filters.companies && filters.companies.length > 0) {
      filtersList.push({
        key: 'companies',
        label: filters.companies.length === 1 ? 'Entreprise' : 'Entreprises',
        value: filters.companies.join(', '),
        count: filters.companies.length,
      });
    }

    // Date range
    if (filters.dateRange.from || filters.dateRange.to) {
      const fromDate = filters.dateRange.from 
        ? new Date(filters.dateRange.from).toLocaleDateString('fr-CA')
        : 'Début';
      const toDate = filters.dateRange.to 
        ? new Date(filters.dateRange.to).toLocaleDateString('fr-CA')
        : 'Fin';
      
      filtersList.push({
        key: 'dateRange',
        label: 'Période',
        value: `${fromDate} - ${toDate}`,
      });
    }

    // Value range
    if (filters.valueRange.min !== undefined || filters.valueRange.max !== undefined) {
      const min = filters.valueRange.min?.toLocaleString('fr-CA') || '0';
      const max = filters.valueRange.max?.toLocaleString('fr-CA') || '∞';
      
      filtersList.push({
        key: 'valueRange',
        label: 'Valeur',
        value: `${min} - ${max} $`,
      });
    }

    // Probability range
    if (filters.probabilityRange.min !== undefined || filters.probabilityRange.max !== undefined) {
      const min = filters.probabilityRange.min || 0;
      const max = filters.probabilityRange.max || 100;
      
      filtersList.push({
        key: 'probabilityRange',
        label: 'Probabilité',
        value: `${min}% - ${max}%`,
      });
    }

    return filtersList;
  }, [filters]);

  const hasActiveFilters = activeFilters.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">
            Filtres actifs
          </h3>
          {resultsCount !== undefined && (
            <span className="text-sm text-gray-500">
              ({resultsCount} résultat{resultsCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        
        {activeFilters.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Effacer tout
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <FilterPill
            key={`${filter.key}-${filter.value}`}
            label={filter.label}
            {...(filter.count !== undefined && { count: filter.count })}
            variant="primary"
            size="sm"
            onRemove={() => onRemoveFilter(filter.key)}
            className="animate-in fade-in-0 slide-in-from-left-2 duration-200"
          />
        ))}
      </div>
    </div>
  );
}
