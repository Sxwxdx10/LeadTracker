'use client';

import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStages } from '@/hooks/useLeads';
import { LeadQueryParams, LeadStatus } from '@/types/lead';
import { cn } from '@/lib/utils';

interface LeadsFiltersProps {
  filters: LeadQueryParams;
  onFiltersChange: (filters: LeadQueryParams) => void;
  className?: string;
}

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'Open', label: 'Ouvert' },
  { value: 'InProgress', label: 'En cours' },
  { value: 'Qualified', label: 'Qualifié' },
  { value: 'Unqualified', label: 'Non qualifié' },
  { value: 'Won', label: 'Gagné' },
  { value: 'Lost', label: 'Perdu' },
];

export default function LeadsFilters({ 
  filters, 
  onFiltersChange, 
  className 
}: LeadsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  
  const { data: stages, isLoading: stagesLoading } = useStages();

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Debounce la recherche
    const timeoutId = setTimeout(() => {
    onFiltersChange({
      ...filters,
      searchTerm: value.trim() || undefined,
      page: 1, // Reset à la première page lors d'une recherche
    });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const handleStatusFilter = (status: LeadStatus) => {
    const newStatus = filters.status === status ? undefined : status;
    onFiltersChange({
      ...filters,
      status: newStatus,
      page: 1,
    });
  };

  const handleStageFilter = (stageId: string) => {
    const newStageId = filters.stageId === stageId ? undefined : stageId;
    onFiltersChange({
      ...filters,
      stageId: newStageId,
      page: 1,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize || 10,
      sortBy: filters.sortBy || 'createdAt',
      sortDirection: filters.sortDirection || 'desc',
    });
  };

  const hasActiveFilters = !!(
    filters.searchTerm || 
    filters.status || 
    filters.stageId || 
    filters.ownerId
  );

  const activeFiltersCount = [
    filters.searchTerm,
    filters.status,
    filters.stageId,
    filters.ownerId,
  ].filter(Boolean).length;

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4', className)}>
      {/* Barre de recherche principale */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, email, entreprise..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Filtres étendus */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Filtres par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusFilter(status.value)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-full border transition-colors',
                    filters.status === status.value
                      ? 'bg-brand-100 border-brand-300 text-brand-800'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtres par étape */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Étape du pipeline
            </label>
            <div className="flex flex-wrap gap-2">
              {stagesLoading ? (
                // Skeleton loading pour les étapes
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))
              ) : stages && stages.length > 0 ? (
                stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageFilter(stage.id)}
                    className={cn(
                      'px-3 py-1 text-sm rounded-full border transition-colors',
                      filters.stageId === stage.id
                        ? 'bg-brand-100 border-brand-300 text-brand-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {stage.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune étape disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            
            {filters.searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Recherche: "{filters.searchTerm}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {LEAD_STATUSES.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => handleStatusFilter(filters.status!)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.stageId && stages && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {stages.find(s => s.id === filters.stageId)?.name}
                <button
                  onClick={() => handleStageFilter(filters.stageId!)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
