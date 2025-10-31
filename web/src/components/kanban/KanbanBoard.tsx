'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { KanbanColumn } from '@/types/kanban';
import { useKanbanBoard, useMoveLead, transformLeadToKanbanLead, createVirtualColumns, transformStatsToKanbanMetrics } from '@/hooks/useKanban';
import { useSignalR } from '@/hooks/useSignalR';
import { Lead, Stage } from '@/types/lead';
import { KanbanColumnComponent } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanMetrics } from './KanbanMetrics';
import { KanbanFilters } from './KanbanFilters';
import { KanbanCustomization } from './KanbanCustomization';
import { Button } from '@/components/ui/button';
import { 
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  FunnelIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface KanbanBoardProps {
  className?: string;
  leads?: Lead[];
  stages?: Stage[];
}


export function KanbanBoard({ className = '', leads, stages }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  
  // Utiliser les données passées en props au lieu de l'API
  const board = leads && stages ? {
    columns: createVirtualColumns(leads, stages),
    leads: leads.map(lead => transformLeadToKanbanLead(lead)),
    metrics: transformStatsToKanbanMetrics({ totalLeads: leads.length, totalValue: leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0) })
  } : null;
  const isLoading = false; // Pas de loading car les données sont déjà chargées
  const error = null; // Pas d'erreur car les données sont déjà chargées
  
  const moveLeadMutation = useMoveLead();
  const { isConnected } = useSignalR();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    const newOverId = over?.id as string | null;
    setOverId(newOverId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the lead being dragged
    const draggedLead = board.leads.find(lead => lead.id === activeId);
    if (!draggedLead) return;

    // Check if we're dropping on the same lead (no-op)
    if (activeId === overId) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Determine if we're dropping on a column or another lead
    const isOverColumn = board.columns.some(col => col.id === overId);
    const isOverLead = board.leads.some(lead => lead.id === overId);

    let targetStageId = draggedLead.stageId;

    if (isOverColumn) {
      targetStageId = overId;
    } else if (isOverLead) {
      // When dropping on a lead, always move to the same stage as that lead
      const targetLead = board.leads.find(lead => lead.id === overId);
      if (targetLead) {
        targetStageId = targetLead.stageId;
      }
    } else {
      // Enhanced fallback: try to find the closest column based on position
      const targetColumn = board.columns.find(col => {
        // Check if overId is a child of this column or contains column ID
        return overId.includes(col.id) || col.id.includes(overId) || 
               over.data.current?.column?.id === col.id;
      });
      
      if (targetColumn) {
        targetStageId = targetColumn.id;
      }
    }

    // Only move if the stage actually changed
    if (targetStageId !== draggedLead.stageId) {
      moveLeadMutation.mutate({
        leadId: activeId,
        toStageId: targetStageId,
        newPosition: 0, // Default position
      }, {
        onError: (error) => {
          toast.error('Erreur lors du déplacement du lead');
          console.error('Move lead error:', error);
        },
      });
    }

    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau Kanban...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ChartBarIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger le tableau Kanban
          </p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune donnée
          </h3>
          <p className="text-gray-600">
            Aucun lead trouvé pour ce tableau Kanban
          </p>
        </div>
      </div>
    );
  }

  const activeLead = activeId ? board.leads.find(lead => lead.id === activeId) : null;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Pipeline de Vente
          </h1>
          {isConnected ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
              Temps réel
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></span>
              Hors ligne
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={showMetrics ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Métriques
          </Button>
          
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          
          <Button
            variant={showCustomization ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCustomization(!showCustomization)}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Personnaliser
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="mb-6">
          <KanbanMetrics metrics={board.metrics} />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <KanbanFilters 
            leads={board.leads}
            onFilterChange={(filteredLeads) => {
              // This would be implemented with local state or a context
              console.log('Filtered leads:', filteredLeads);
            }}
          />
        </div>
      )}

      {/* Customization */}
      {showCustomization && (
        <div className="mb-6">
          <KanbanCustomization 
            onCustomizationChange={(customization) => {
              // This would be implemented with local state or a context
              console.log('Customization changed:', customization);
            }}
          />
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex space-x-6 h-full overflow-x-auto pb-4 items-stretch">
            {board.columns
              .sort((a, b) => a.order - b.order)
              .map((column) => {
                // Filter leads for this column
                const columnLeads = board.leads.filter(lead => {
                  if (column.isWonStage) {
                    return lead.status === 'Won';
                  } else if (column.isLostStage) {
                    return lead.status === 'Lost';
                  } else {
                    // For detailed stages, show leads that are in this specific stage AND have Open status
                    const isInThisStage = lead.stageId === column.id;
                    const hasOpenStatus = lead.status === 'Open' || lead.status === 'InProgress' || lead.status === 'Qualified';
                    return isInThisStage && hasOpenStatus;
                  }
                });
              
                return (
                  <KanbanColumnComponent
                    key={column.id}
                    column={column}
                    leads={columnLeads}
                    isOver={overId === column.id}
                  />
                );
              })}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="transform rotate-3 opacity-95">
                <KanbanCard lead={activeLead} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
