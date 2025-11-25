'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import LeadsTable from '@/components/leads/LeadsTable';
import { MondayTableView } from '@/components/views/MondayTableView';
import { TimelineView } from '@/components/views/TimelineView';
import { CalendarView } from '@/components/views/CalendarView';
import { ViewSelector } from '@/components/views/ViewSelector';
import { useUpdateLead, useDeleteLead } from '@/hooks/useLeads';
import { LeadStats } from '@/components/leads/LeadStats';
import { LeadFiltersPanel } from '@/components/leads/LeadFiltersPanel';
import { ActiveFiltersDisplay } from '@/components/leads/ActiveFiltersDisplay';
import { SearchBar } from '@/components/ui/SearchBar';
import { useSignalR } from '@/hooks/useSignalR';
import { useFilterPanel } from '@/hooks/useFilterPanel';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useLeads, useStages } from '@/hooks/useLeads';
import { ViewType } from '@/types/views';
import { UpdateLeadDto, LeadStatus } from '@/types/lead';
import { CreateLeadModal } from '@/components/leads/import';
import { exportLeadsToCsv } from '@/utils/csvExport';
import { leadsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

function LeadsPageContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewType>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [queryParams, setQueryParams] = useState<{
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  }>({
    page: 1,
    pageSize: 25,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  // Initialize SignalR connection for real-time updates
  useSignalR();

  // Filter panel hooks
  const filterPanel = useFilterPanel();
  const savedFilters = useSavedFilters();

  // Mutation hooks
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();
  
  // Récupérer les données des leads pour les options dynamiques (paginées pour le tableau)
  const { data: leadsData } = useLeads({
    ...queryParams,
    ...filterPanel.toQueryParams(),
  });
  
  // Récupérer TOUS les leads pour le Kanban (sans pagination)
  const { data: allLeadsData } = useLeads({
    page: 1,
    pageSize: 1000, // Large page size to get all leads
    sortBy: queryParams.sortBy,
    sortDirection: queryParams.sortDirection,
    ...filterPanel.toQueryParams(),
  });
  
  // Récupérer les stages pour la logique Kanban
  const { data: stagesData } = useStages();

  // Load saved filters on mount
  useEffect(() => {
    savedFilters.loadSavedFilters();
  }, []);

  const handleExportCSV = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Récupération des leads...');
      
      // Get all leads with current filters applied
      // First, get the total count to know how many leads to fetch
      const filterParams = {
        ...filterPanel.toQueryParams(),
        page: 1,
        pageSize: 1000, // Large page size to get all leads at once
        sortBy: queryParams.sortBy,
        sortDirection: queryParams.sortDirection,
      };
      
      const response = await leadsApi.getLeads(filterParams);
      
      // If there are more leads, we might need to fetch them in batches
      let allLeads = [...response.data];
      
      if (response.totalCount > 1000) {
        // Fetch remaining pages
        const totalPages = Math.ceil(response.totalCount / 1000);
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        
        const additionalResponses = await Promise.all(
          remainingPages.map(page =>
            leadsApi.getLeads({ ...filterParams, page, pageSize: 1000 })
          )
        );
        
        additionalResponses.forEach(res => {
          allLeads = [...allLeads, ...res.data];
        });
      }
      
      // Apply client-side filters if needed
      const filteredLeads = filterPanel.applyClientSideFilters(
        allLeads,
        stagesData || [],
        filterPanel.filters
      );
      
      if (filteredLeads.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('Aucun lead à exporter avec les filtres actuels');
        return;
      }
      
      // Export to CSV
      exportLeadsToCsv(filteredLeads);
      
      toast.dismiss(loadingToast);
      toast.success(`${filteredLeads.length} lead(s) exporté(s) avec succès`);
    } catch (error: any) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'export CSV');
    }
  };

  const handleParamsChange = (newParams: any) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams,
      // Reset to page 1 when filters or sorting change
      page: 1,
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

  const handleNewLead = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Barre d'outils spécifique à la page */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              {/* Sélecteur de vue Monday.com style */}
              <ViewSelector 
                currentView={viewMode} 
                onViewChange={setViewMode}
              />
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
              
              <Button onClick={handleNewLead} className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Nouveau lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - structure flex optimisée */}
      <div className="flex-1 flex flex-col">
        {/* Section en-tête - prend seulement l'espace nécessaire */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 xl:px-12 pt-3 pb-2">
          {/* Statistiques */}
          <div className="mb-2">
            <LeadStats />
          </div>

          {/* Barre de recherche principale */}
          <div className="mb-2">
            <SearchBar
              value={filterPanel.filters.searchTerm}
              onChange={(value) => filterPanel.updateFilter('searchTerm', value)}
              placeholder="Rechercher des leads par nom, email, société, notes..."
              className="max-w-4xl"
            />
          </div>

          {/* Filtres actifs */}
          {filterPanel.hasActiveFilters && (
            <div className="mb-2">
              <ActiveFiltersDisplay
                filters={filterPanel.filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={filterPanel.clearFilters}
                className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
              />
            </div>
          )}
        </div>

        {/* Zone de contenu principal - prend TOUT l'espace restant */}
        <div className="flex flex-col px-4 sm:px-6 lg:px-8 xl:px-12 pb-3">
          {viewMode === 'table' ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 min-h-0">
              <MondayTableView
                leads={leadsData?.data ? filterPanel.applyClientSideFilters(leadsData.data, stagesData || [], filterPanel.filters) : []}
                {...(leadsData?.totalCount !== undefined && { totalCount: leadsData.totalCount })}
                currentPage={leadsData?.page || queryParams.page}
                totalPages={leadsData?.totalPages || 1}
                hasNextPage={leadsData?.hasNextPage || false}
                hasPreviousPage={leadsData?.hasPreviousPage || false}
                pageSize={queryParams.pageSize}
                sortBy={queryParams.sortBy}
                sortDirection={queryParams.sortDirection}
                onPageChange={(page) => {
                  setQueryParams(prev => ({ ...prev, page }));
                }}
                onSortChange={(sortBy, sortDirection) => {
                  setQueryParams(prev => ({ 
                    ...prev, 
                    sortBy, 
                    sortDirection,
                    page: 1 // Reset to first page when sorting changes
                  }));
                }}
                onLeadClick={(lead) => {
                  router.push(`/leads/${lead.id}`);
                }}
                onLeadUpdate={async (leadId, updates) => {
                  // Récupérer le lead actuel depuis les données chargées
                  const currentLead = leadsData?.data?.find(lead => lead.id === leadId);
                  if (!currentLead) {
                    toast.error('Lead introuvable');
                    return;
                  }
                  
                  // Détecter si c'est un changement de statut ou d'étape
                  const isStatusChange = 'status' in updates && updates.status !== currentLead.status;
                  const isStageChange = 'stageId' in updates && updates.stageId !== currentLead.stageId;
                  
                  // Fusionner les mises à jour avec les données existantes
                  // S'assurer que tous les champs requis sont présents
                  const fullUpdate: UpdateLeadDto = {
                    title: currentLead.title,
                    firstName: currentLead.firstName || '',
                    lastName: currentLead.lastName || '',
                    email: currentLead.email || '',
                    ...(currentLead.phoneNumber && { phoneNumber: currentLead.phoneNumber }),
                    ...(currentLead.website && { website: currentLead.website }),
                    ...(currentLead.company && { company: currentLead.company }),
                    ...(currentLead.jobTitle && { jobTitle: currentLead.jobTitle }),
                    ...(currentLead.estimatedValue !== undefined && { estimatedValue: currentLead.estimatedValue }),
                    ...(currentLead.probability !== undefined && { probability: currentLead.probability }),
                    ...(currentLead.expectedCloseDate && { expectedCloseDate: currentLead.expectedCloseDate }),
                    ...(currentLead.notes && { notes: currentLead.notes }),
                    ...(currentLead.source && { source: currentLead.source }),
                    // CRITICAL: Toujours envoyer le status et stageId actuels
                    // Le backend vérifiera si le stageId correspond au nouveau statut et synchronisera si nécessaire
                    status: isStatusChange ? (updates.status as LeadStatus) : currentLead.status,
                    stageId: isStageChange ? (updates.stageId as string) : currentLead.stageId,
                    // Appliquer les autres mises à jour par-dessus
                    ...Object.fromEntries(
                      Object.entries(updates).filter(([key]) => key !== 'status' && key !== 'stageId')
                    ),
                  };
                  
                  await updateLeadMutation.mutateAsync({ id: leadId, data: fullUpdate });
                }}
                onLeadDelete={async (leadId) => {
                  await deleteLeadMutation.mutateAsync(leadId);
                }}
            />
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
              <KanbanBoard 
                className="w-full" 
                // Passer TOUS les leads filtrés au Kanban (pas seulement les 25 de la pagination)
                leads={allLeadsData?.data ? filterPanel.applyClientSideFilters(allLeadsData.data, stagesData || [], filterPanel.filters) : []}
                stages={stagesData || []}
              />
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 min-h-0">
              <TimelineView 
                leads={allLeadsData?.data ? filterPanel.applyClientSideFilters(allLeadsData.data, stagesData || [], filterPanel.filters) : []}
                onLeadClick={(lead) => {
                  // Navigate to lead detail
                  window.location.href = `/leads/${lead.id}`;
                }}
              />
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 min-h-0">
              <CalendarView 
                leads={allLeadsData?.data ? filterPanel.applyClientSideFilters(allLeadsData.data, stagesData || [], filterPanel.filters) : []}
                onLeadClick={(lead) => {
                  // Navigate to lead detail
                  window.location.href = `/leads/${lead.id}`;
                }}
              />
            </div>
          ) : null}
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

      {/* Modal de création de leads */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

export default function LeadsPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
