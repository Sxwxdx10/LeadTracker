'use client';

import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { LeadStatus } from '@/types/lead';

interface LeadFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  searchTerm?: string;
  status?: LeadStatus | '';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export function LeadFilters({ onFilterChange }: LeadFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const filters: FilterValues = {
      searchTerm: value,
      sortBy,
      sortDirection,
    };
    if (status) filters.status = status;
    onFilterChange(filters);
  };

  const handleStatusChange = (value: string | string[]) => {
    const statusValue = (Array.isArray(value) ? value[0] : value) as LeadStatus | '';
    setStatus(statusValue);
    const filters: FilterValues = {
      searchTerm,
      sortBy,
      sortDirection,
    };
    if (statusValue) filters.status = statusValue;
    onFilterChange(filters);
  };

  const handleSortChange = (value: string | string[]) => {
    const sortValue = (Array.isArray(value) ? value[0] : value) || 'createdAt';
    setSortBy(sortValue);
    const filters: FilterValues = {
      searchTerm,
      sortBy: sortValue,
      sortDirection,
    };
    if (status) filters.status = status;
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('');
    setSortBy('createdAt');
    setSortDirection('desc');
    onFilterChange({
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  };

  const hasActiveFilters = searchTerm || status;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Rechercher des leads..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-48">
          <Select
            value={status}
            onChange={handleStatusChange}
            placeholder="Tous les statuts"
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'Open', label: 'Ouvert' },
              { value: 'InProgress', label: 'En cours' },
              { value: 'Qualified', label: 'Qualifié' },
              { value: 'Unqualified', label: 'Non qualifié' },
              { value: 'Won', label: 'Gagné' },
              { value: 'Lost', label: 'Perdu' },
            ]}
          />
        </div>

        {/* Sort */}
        <div className="w-48">
          <Select
            value={sortBy}
            onChange={handleSortChange}
            options={[
              { value: 'createdAt', label: 'Date de création' },
              { value: 'title', label: 'Titre' },
              { value: 'company', label: 'Entreprise' },
              { value: 'estimatedValue', label: 'Valeur' },
              { value: 'probability', label: 'Probabilité' },
            ]}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}

