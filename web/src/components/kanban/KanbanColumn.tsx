'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { formatCurrency, formatDays, formatPercentage } from '@/hooks/useKanban';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: KanbanLead[];
}

export function KanbanColumnComponent({ column, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const leadIds = leads.map(lead => lead.id);

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Column Header */}
      <div 
        className={cn(
          "rounded-lg p-4 mb-4 border-2 border-dashed transition-colors",
          isOver 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-200 bg-gray-50"
        )}
        style={{ borderColor: isOver ? column.color : undefined }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-gray-900">{column.name}</h3>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {leads.length}
            </span>
          </div>
        </div>

        {/* Column Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Valeur:</span>
            <br />
            {formatCurrency(column.totalValue)}
          </div>
          <div>
            <span className="font-medium">Potentiel:</span>
            <br />
            {formatCurrency(column.potentialValue)}
          </div>
          <div>
            <span className="font-medium">Temps moyen:</span>
            <br />
            {formatDays(column.averageTimeInStageDays)}
          </div>
          <div>
            <span className="font-medium">Conversion:</span>
            <br />
            {formatPercentage(0)} {/* Pas de conversion rate disponible */}
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-lg border-2 border-dashed transition-colors min-h-96",
          isOver 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-200 bg-gray-50"
        )}
        style={{ borderColor: isOver ? column.color : undefined }}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <div className="p-4 space-y-3">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">Aucun lead</p>
                <p className="text-xs text-gray-400">
                  Glissez-déposez des leads ici
                </p>
              </div>
            ) : (
              leads.map((lead) => (
                <KanbanCard key={lead.id} lead={lead} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
