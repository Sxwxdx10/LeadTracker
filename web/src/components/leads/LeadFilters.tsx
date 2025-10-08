'use client';

import React from 'react';

export interface FilterValues {
  status?: string;
  source?: string;
  assignedTo?: string;
  minValue?: number;
  maxValue?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface LeadFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  filters: FilterValues;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({ onFilterChange, filters }) => {
  const handleChange = (key: keyof FilterValues, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="new">Nouveau</option>
            <option value="contacted">Contacté</option>
            <option value="qualified">Qualifié</option>
            <option value="proposal">Proposition</option>
            <option value="negotiation">Négociation</option>
            <option value="won">Gagné</option>
            <option value="lost">Perdu</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            value={filters.source || ''}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes</option>
            <option value="website">Site web</option>
            <option value="referral">Référence</option>
            <option value="social">Réseaux sociaux</option>
            <option value="email">Email</option>
            <option value="phone">Téléphone</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Assigné à */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigné à
          </label>
          <input
            type="text"
            value={filters.assignedTo || ''}
            onChange={(e) => handleChange('assignedTo', e.target.value)}
            placeholder="Nom de l'utilisateur"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Valeur minimale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valeur min (€)
          </label>
          <input
            type="number"
            value={filters.minValue || ''}
            onChange={(e) => handleChange('minValue', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Valeur maximale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valeur max (€)
          </label>
          <input
            type="number"
            value={filters.maxValue || ''}
            onChange={(e) => handleChange('maxValue', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="10000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date de début */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date de fin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bouton de réinitialisation */}
      <div className="flex justify-end">
        <button
          onClick={() => onFilterChange({})}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
};

export default LeadFilters;
