'use client';

import React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface QuickFilter {
  id: string;
  label: string;
  active: boolean;
  count?: number;
  color?: string;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  onFilterToggle: (filterId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function QuickFilters({ 
  filters, 
  onFilterToggle, 
  onClearAll,
  className 
}: QuickFiltersProps) {
  const activeFilters = filters.filter(f => f.active);
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterToggle(filter.id)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            "border-2 hover:shadow-sm",
            filter.active
              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:border-brand-300 hover:bg-brand-50"
          )}
          style={filter.color && filter.active ? { borderColor: filter.color } : undefined}
        >
          <span>{filter.label}</span>
          {filter.count !== undefined && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-xs font-semibold",
              filter.active ? "bg-white/20" : "bg-gray-100"
            )}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
      
      {hasActiveFilters && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 text-xs"
        >
          <XMarkIcon className="h-3 w-3 mr-1" />
          Effacer tout
        </Button>
      )}
    </div>
  );
}

