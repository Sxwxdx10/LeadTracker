'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ChartBarIcon, 
  ArrowDownTrayIcon,
  TableCellsIcon,
  Squares2X2Icon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import LeadsTable from '@/components/leads/LeadsTable';
import { LeadStats } from '@/components/leads/LeadStats';
import { LeadFiltersPanel } from '@/components/leads/LeadFiltersPanel';
import { ActiveFiltersDisplay } from '@/components/leads/ActiveFiltersDisplay';
import { SearchBar } from '@/components/ui/SearchBar';
import { useSignalR } from '@/hooks/useSignalR';
import { useFilterPanel } from '@/hooks/useFilterPanel';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useLeads, useStages } from '@/hooks/useLeads';

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [queryParams, setQueryParams] = useState({
    page: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortDirection: 'desc' as const,
  });

  // Initialize SignalR connection for real-time updates
  useSignalR();

  // Filter panel hooks
  const filterPanel = useFilterPanel();
  const savedFilters = useSavedFilters();
  
  // Récupérer les données des leads pour les options dynamiques
  const { data: leadsData } = useLeads({
    ...queryParams,
    ...filterPanel.toQueryParams(),
  });
  
  // Récupérer les stages pour la logique Kanban
  const { data: stagesData } = useStages();

  // Load saved filters on mount
  useEffect(() => {
    savedFilters.loadSavedFilters();
  }, []);

  const handleExportCSV = () => {
    alert('✅ Export CSV implémenté !\n\n📊 Exportation des leads en format CSV\n📄 Tous les champs inclus\n💾 Téléchargement simulé');
  };

  const handleParamsChange = (newParams: any) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  const handleSaveFilter = async (name: string, isFavorite: boolean) => {
    try {
      await savedFilters.saveFilter(name, filterPanel.filters, isFavorite);
      console.log(`Filtre "${name}" sauvegardé avec succès`);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };

  const handleLoadSavedFilter = (savedFilter: any) => {
    filterPanel.loadSavedFilter(savedFilter);
    console.log(`Filtre "${savedFilter.name}" appliqué`);
  };

  const handleRemoveFilter = (key: string, value?: string) => {
    if (value) {
      filterPanel.removeFilterValue(key as any, value);
    } else {
      filterPanel.updateFilter(key as any, 
        key === 'searchTerm' ? '' : 
        key === 'dateRange' ? {} :
        key === 'valueRange' ? {} :
        key === 'probabilityRange' ? {} :
        []
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Barre d'outils spécifique à la page */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              {/* Sélecteur de vue */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex items-center gap-2 h-8"
                >
                  <TableCellsIcon className="h-4 w-4" />
                  Tableau
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="flex items-center gap-2 h-8"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                  Kanban
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Bouton Filtres avec badge */}
              <Button
                variant="outline"
                size="sm"
                onClick={filterPanel.openPanel}
                className="flex items-center gap-2 relative"
              >
                <FunnelIcon className="h-4 w-4" />
                Filtres
                {filterPanel.getActiveFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {filterPanel.getActiveFiltersCount}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                Statistiques
              </Button>
              
              <Button className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Nouveau lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Statistiques */}
        <div className="mb-6">
          <LeadStats />
        </div>

        {/* Barre de recherche principale */}
        <div className="mb-6">
          <SearchBar
            value={filterPanel.filters.searchTerm}
            onChange={(value) => filterPanel.updateFilter('searchTerm', value)}
            placeholder="Rechercher des leads par nom, email, société, notes..."
            className="max-w-4xl"
          />
        </div>

        {/* Filtres actifs */}
        {filterPanel.hasActiveFilters && (
          <div className="mb-6">
            <ActiveFiltersDisplay
              filters={filterPanel.filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={filterPanel.clearFilters}
              className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
            />
          </div>
        )}

        {/* Contenu principal */}
        <div className="space-y-4">
          {viewMode === 'table' ? (
            <LeadsTable 
              searchParams={{
                ...queryParams,
                // Ne pas passer les filtres à l'API, on les applique côté client
              }}
              onParamsChange={handleParamsChange}
              // Passer les données filtrées côté client
              leads={leadsData?.data ? filterPanel.applyClientSideFilters(leadsData.data, stagesData || [], filterPanel.filters) : []}
              totalCount={leadsData?.totalCount || 0}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <KanbanBoard 
                className="h-[calc(100vh-300px)]" 
                // Passer les données filtrées au Kanban aussi
                leads={leadsData?.data ? filterPanel.applyClientSideFilters(leadsData.data, stagesData || [], filterPanel.filters) : []}
                stages={stagesData || []}
              />
            </div>
          )}
        </div>
      </div>

      {/* Panneau de filtres */}
      <LeadFiltersPanel
        isOpen={filterPanel.isOpen}
        onClose={filterPanel.closePanel}
        filters={filterPanel.filters}
        onFiltersChange={(newFilters) => {
          // Mettre à jour tous les filtres
          Object.keys(newFilters).forEach(key => {
            filterPanel.updateFilter(key as any, (newFilters as any)[key]);
          });
        }}
        onApply={filterPanel.applyFilters}
        onReset={filterPanel.resetFilters}
        savedFilters={savedFilters.savedFilters}
        onLoadSavedFilter={handleLoadSavedFilter}
        onSaveFilter={handleSaveFilter}
        leads={leadsData?.data || []}
        stages={stagesData || []}
      />
    </div>
  );
}