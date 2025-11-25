'use client';

import React, { useState, useMemo } from 'react';
import { KanbanLead, KanbanFilters as KanbanFiltersType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface KanbanFiltersProps {
  leads: KanbanLead[];
  onFilterChange: (filteredLeads: KanbanLead[]) => void;
}

export function KanbanFilters({ leads, onFilterChange }: KanbanFiltersProps) {
  const [filters, setFilters] = useState<KanbanFiltersType>({
    searchTerm: '',
    assignedUserId: '',
    showOverdueOnly: false,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique assigned users for filter
  const assignedUsers = useMemo(() => {
    const users = leads
      .filter(lead => lead.assignedUserName)
      .map(lead => ({
        id: lead.assignedUserId!,
        name: lead.assignedUserName!,
      }));
    
    // Remove duplicates
    return users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
  }, [leads]);

  // Apply filters
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.title.toLowerCase().includes(searchLower) ||
        lead.contactName?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower)
      );
    }

    // Assigned user filter
    if (filters.assignedUserId) {
      filtered = filtered.filter(lead => lead.assignedUserId === filters.assignedUserId);
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(lead => {
        if (!lead.expectedCloseDate) return false;
        const leadDate = new Date(lead.expectedCloseDate);
        return leadDate >= filters.dateRange!.start && leadDate <= filters.dateRange!.end;
      });
    }

    // Value range filter
    if (filters.valueRange) {
      filtered = filtered.filter(lead => {
        if (!lead.estimatedValue) return false;
        return lead.estimatedValue >= filters.valueRange!.min && 
               lead.estimatedValue <= filters.valueRange!.max;
      });
    }

    // Probability range filter
    if (filters.probabilityRange) {
      filtered = filtered.filter(lead =>
        lead.probability >= filters.probabilityRange!.min && 
        lead.probability <= filters.probabilityRange!.max
      );
    }

    // Overdue filter
    if (filters.showOverdueOnly) {
      filtered = filtered.filter(lead => lead.isOverdue);
    }

    return filtered;
  }, [leads, filters]);

  // Notify parent of filtered results
  React.useEffect(() => {
    onFilterChange(filteredLeads);
  }, [filteredLeads, onFilterChange]);

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      assignedUserId: '',
      showOverdueOnly: false,
    });
  };

  const hasActiveFilters = filters.searchTerm || 
                          filters.assignedUserId || 
                          filters.dateRange || 
                          filters.valueRange || 
                          filters.probabilityRange || 
                          filters.showOverdueOnly;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Filtres
          </h3>
          {hasActiveFilters && (
            <span className="bg-brand-100 text-brand-800 text-xs px-2 py-1 rounded-full">
              {filteredLeads.length} / {leads.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Réduire' : 'Étendre'}
          </Button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un lead..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>

        {/* Assigned User */}
        <div>
          <Label htmlFor="assigned-user" className="text-xs text-gray-600">
            Assigné à
          </Label>
          <select
            id="assigned-user"
            value={filters.assignedUserId || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              assignedUserId: e.target.value 
            }))}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les utilisateurs</option>
            {assignedUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Overdue Filter */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.showOverdueOnly}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                showOverdueOnly: e.target.checked 
              }))}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600">
              En retard uniquement
            </span>
          </label>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Value Range */}
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">
                Valeur estimée
              </Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.valueRange?.min || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    valueRange: {
                      min: e.target.value ? Number(e.target.value) : 0,
                      max: prev.valueRange?.max || 1000000
                    }
                  }))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.valueRange?.max || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    valueRange: {
                      min: prev.valueRange?.min || 0,
                      max: e.target.value ? Number(e.target.value) : 1000000
                    }
                  }))}
                />
              </div>
            </div>

            {/* Probability Range */}
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">
                Probabilité (%)
              </Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="100"
                  value={filters.probabilityRange?.min || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    probabilityRange: {
                      min: e.target.value ? Number(e.target.value) : 0,
                      max: prev.probabilityRange?.max || 100
                    }
                  }))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="100"
                  value={filters.probabilityRange?.max || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    probabilityRange: {
                      min: prev.probabilityRange?.min || 0,
                      max: e.target.value ? Number(e.target.value) : 100
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
