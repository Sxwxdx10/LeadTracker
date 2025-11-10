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
import { KanbanCustomization } from './KanbanCustomization';
import { Button } from '@/components/ui/button';
import { 
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { AnimatePresence, motion } from 'framer-motion';

interface KanbanBoardProps {
  className?: string;
  leads?: Lead[];
  stages?: Stage[];
}


export function KanbanBoard({ className = '', leads, stages }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeIds, setActiveIds] = useState<string[]>([]); // Multiple selected cards
  const [overId, setOverId] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showCustomization, setShowCustomization] = useState(false);

  // Undo/Redo and selection management
  const { canUndo, canRedo, undo, redo, addAction, getUndoDescription, getRedoDescription } = useUndoRedo();
  const { selectedLeads, toggleLeadSelection, clearSelections, setMultiSelectMode, isMultiSelectMode } = useKanbanStore();
  
  // Utiliser les données passées en props au lieu de l'API
  const board = leads && stages ? (() => {
    // Create a map of stage types for quick lookup
    const stageTypeMap = new Map<string, { isWonStage: boolean; isLostStage: boolean }>();
    stages.forEach(stage => {
      stageTypeMap.set(stage.id, { 
        isWonStage: stage.isWonStage || false, 
        isLostStage: stage.isLostStage || false 
      });
    });

    // CRITICAL: Auto-correct inconsistent leads on display
    const correctedLeads = leads.map(lead => {
      const stageType = stageTypeMap.get(lead.stageId);
      
      // If stage type is known, check for inconsistencies
      if (stageType) {
        // If in a Won stage but status is not Won, correct it
        if (stageType.isWonStage && lead.status !== 'Won') {
          console.warn(`🔄 Auto-correcting lead ${lead.id}: stage is Won but status is ${lead.status} → changing to 'Won'`);
          return { ...lead, status: 'Won' as const };
        }
        // If in a Lost stage but status is not Lost, correct it
        if (stageType.isLostStage && lead.status !== 'Lost') {
          console.warn(`🔄 Auto-correcting lead ${lead.id}: stage is Lost but status is ${lead.status} → changing to 'Lost'`);
          return { ...lead, status: 'Lost' as const };
        }
        // If in a normal stage but status is Won/Lost, change to Open
        if (!stageType.isWonStage && !stageType.isLostStage && 
            (lead.status === 'Won' || lead.status === 'Lost')) {
          console.warn(`🔄 Auto-correcting lead ${lead.id}: normal stage but status is ${lead.status} → changing to 'Open'`);
          return { ...lead, status: 'Open' as const };
        }
      }
      return lead;
    });

    const totalLeads = correctedLeads.length;
    const totalValue = correctedLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
    // Calcul des statuts - aligné avec le backend et le pie chart
    // Le pie chart montre: Ouverts, Qualifiés, Gagnés, Perdus séparément
    const openLeads = correctedLeads.filter(lead => lead.status === 'Open').length;
    const qualifiedLeads = correctedLeads.filter(lead => lead.status === 'Qualified').length;
    const wonLeads = correctedLeads.filter(lead => lead.status === 'Won').length;
    const lostLeads = correctedLeads.filter(lead => lead.status === 'Lost').length;
    const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    
    // Debug logs
    console.log('📊 Kanban Metrics Calculation:', {
      totalLeads,
      wonLeads,
      openLeads,
      qualifiedLeads,
      lostLeads,
      conversionRate: `${conversionRate.toFixed(1)}%`
    });

    const metrics = transformStatsToKanbanMetrics({
      totalLeads,
      openLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      totalValue,
      averageValue,
      conversionRate
    });
    
    console.log('📈 Transformed Metrics:', {
      overallConversionRate: metrics.overallConversionRate,
      totalLeads: metrics.totalLeads,
      wonLeads: metrics.wonLeads
    });

    return {
      columns: createVirtualColumns(correctedLeads, stages),
      leads: correctedLeads.map(lead => transformLeadToKanbanLead(lead)),
      metrics
    };
  })() : null;
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
    const draggedId = event.active.id as string;
    
    // If we're in multi-select mode and have selected leads, drag all selected
    if (isMultiSelectMode && selectedLeads.length > 0 && selectedLeads.includes(draggedId)) {
      setActiveIds(selectedLeads);
      setActiveId(null); // Don't set single active ID when multi-dragging
    } else {
      setActiveId(draggedId);
      setActiveIds([]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    const newOverId = over?.id as string | null;
    setOverId(newOverId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !board) {
      setActiveId(null);
      setActiveIds([]);
      setOverId(null);
      return;
    }

    const overId = over.id as string;

    // Determine target stage
    const isOverColumn = board.columns.some(col => col.id === overId);
    const isOverLead = board.leads.some(lead => lead.id === overId);

    let targetStageId: string | null = null;

    if (isOverColumn) {
      targetStageId = overId;
    } else if (isOverLead) {
      const targetLead = board.leads.find(lead => lead.id === overId);
      if (targetLead) {
        targetStageId = targetLead.stageId;
      }
    } else {
      const targetColumn = board.columns.find(col => {
        return overId.includes(col.id) || col.id.includes(overId) || 
               over.data.current?.column?.id === col.id;
      });
      if (targetColumn) {
        targetStageId = targetColumn.id;
      }
    }

    if (!targetStageId) {
      setActiveId(null);
      setActiveIds([]);
      setOverId(null);
      return;
    }

    // Handle multi-drag (multiple selected cards)
    const leadsToMove = activeIds.length > 0 
      ? activeIds.filter(id => board.leads.find(l => l.id === id))
      : [active.id as string];

    const moves: Array<{ leadId: string; fromStageId: string; toStageId: string }> = [];

    for (const leadId of leadsToMove) {
      const lead = board.leads.find(l => l.id === leadId);
      if (lead && lead.stageId !== targetStageId) {
        moves.push({
          leadId,
          fromStageId: lead.stageId,
          toStageId: targetStageId
        });
      }
    }

    if (moves.length === 0) {
      setActiveId(null);
      setActiveIds([]);
      setOverId(null);
      return;
    }

    // Store previous state for undo
    const previousStates = moves.map(move => ({
      leadId: move.leadId,
      stageId: move.fromStageId
    }));

    // Create undo/redo action
    const actionDescription = moves.length === 1 
      ? `Déplacer 1 lead vers ${board.columns.find(c => c.id === targetStageId)?.name || targetStageId}`
      : `Déplacer ${moves.length} leads vers ${board.columns.find(c => c.id === targetStageId)?.name || targetStageId}`;

    addAction({
      type: 'bulk_move',
      description: actionDescription,
      timestamp: Date.now(),
      data: { moves, previousStates },
      undo: async () => {
        // Restore previous states
        for (const state of previousStates) {
          moveLeadMutation.mutate({
            leadId: state.leadId,
            toStageId: state.stageId,
            newPosition: 0
          });
        }
      },
      redo: async () => {
        // Re-apply moves
        for (const move of moves) {
          moveLeadMutation.mutate({
            leadId: move.leadId,
            toStageId: move.toStageId,
            newPosition: 0
          });
        }
      }
    });

    // Execute moves with animations
    for (const move of moves) {
      moveLeadMutation.mutate({
        leadId: move.leadId,
        toStageId: move.toStageId,
        newPosition: 0
      }, {
        onError: (error) => {
          toast.error(`Erreur lors du déplacement du lead ${move.leadId}`);
          console.error('Move lead error:', error);
        },
      });
    }

    // Clear selections after successful move
    if (activeIds.length > 0) {
      clearSelections();
    }

    setActiveId(null);
    setActiveIds([]);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveIds([]);
    setOverId(null);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          toast.success(getUndoDescription() || 'Action annulée');
        }
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast.success(getRedoDescription() || 'Action refaite');
        }
      }
      // Escape to clear selections
      if (e.key === 'Escape') {
        clearSelections();
        setMultiSelectMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, getUndoDescription, getRedoDescription, clearSelections, setMultiSelectMode]);

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
  const activeLeads = activeIds.length > 0 
    ? board.leads.filter(lead => activeIds.includes(lead.id))
    : activeLead ? [activeLead] : [];

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
          {/* Undo/Redo buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (await undo()) {
                toast.success(getUndoDescription() || 'Action annulée');
              }
            }}
            disabled={!canUndo}
            title={getUndoDescription() || 'Annuler (Ctrl+Z)'}
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (await redo()) {
                toast.success(getRedoDescription() || 'Action refaite');
              }
            }}
            disabled={!canRedo}
            title={getRedoDescription() || 'Refaire (Ctrl+Shift+Z)'}
          >
            <ArrowUturnRightIcon className="h-4 w-4" />
          </Button>

          {/* Multi-select toggle */}
          <Button
            variant={isMultiSelectMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMultiSelectMode(!isMultiSelectMode);
              if (!isMultiSelectMode) {
                clearSelections();
              }
            }}
            title="Mode sélection multiple"
          >
            <Squares2X2Icon className="h-4 w-4 mr-2" />
            Sélection multiple
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            variant={showMetrics ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Métriques
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
                // Filter leads for this column with strict validation
                const columnLeads = board.leads
                  .filter(lead => {
                    if (column.isWonStage) {
                      // For Won columns: must have Won status AND be in this specific Won stage
                      // This prevents leads with Won status but wrong stageId from appearing elsewhere
                      return lead.status === 'Won' && lead.stageId === column.id;
                    } else if (column.isLostStage) {
                      // For Lost columns: must have Lost status AND be in this specific Lost stage
                      // This prevents leads with Lost status but wrong stageId from appearing elsewhere
                      return lead.status === 'Lost' && lead.stageId === column.id;
                    } else {
                      // For normal stages (Nouveau, Qualifié, Proposition, Négociation)
                      // CRITICAL: Explicitly exclude leads with Won/Lost status to prevent them from appearing
                      if (lead.status === 'Won' || lead.status === 'Lost') {
                        return false;
                      }
                      // Show leads that are in this specific stage AND have Open/Qualified status
                      const isInThisStage = lead.stageId === column.id;
                      const hasOpenStatus = lead.status === 'Open' || lead.status === 'Qualified';
                      return isInThisStage && hasOpenStatus;
                    }
                  })
                  .map(lead => ({
                    ...lead,
                    isSelected: selectedLeads.includes(lead.id)
                  }));
              
                return (
                  <KanbanColumnComponent
                    key={column.id}
                    column={column}
                    leads={columnLeads}
                    isOver={overId === column.id}
                    onLeadSelect={toggleLeadSelection}
                    showSelectCheckboxes={isMultiSelectMode}
                  />
                );
              })}
          </div>

          <DragOverlay>
            <AnimatePresence>
              {activeLeads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 0.95, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2"
                >
                  {activeLeads.length === 1 && activeLeads[0] ? (
                    <div className="transform rotate-3 shadow-2xl">
                      <KanbanCard lead={activeLeads[0]} isDragging />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-t-lg text-sm font-semibold mb-2 shadow-lg">
                        {activeLeads.length} lead{activeLeads.length > 1 ? 's' : ''} sélectionné{activeLeads.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-col gap-2 max-h-[400px] overflow-auto bg-white rounded-lg shadow-2xl p-2 transform rotate-2">
                        {activeLeads.slice(0, 5).map((lead, index) => (
                          <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <KanbanCard 
                              lead={lead} 
                              isDragging 
                              cardSize="small"
                              cardLayout="compact"
                            />
                          </motion.div>
                        ))}
                        {activeLeads.length > 5 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            + {activeLeads.length - 5} autre{activeLeads.length - 5 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
