'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanLead, KanbanColumn as KanbanColumnType } from '@/types/kanban';
import { SwimLaneData } from '@/types/swimlanes';
import { KanbanCard } from './KanbanCard';
import { SwimLaneHeader } from './SwimLaneHeader';
import { cn } from '@/lib/utils';

interface SwimLaneProps {
  lane: SwimLaneData;
  columns: KanbanColumnType[];
  getLeadsForColumn: (columnId: string, laneId: string) => KanbanLead[];
  isOver?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  cardLayout?: 'compact' | 'detailed';
  onLeadClick?: (lead: KanbanLead) => void;
  onLeadSelect?: (leadId: string, selected: boolean) => void;
  showSelectCheckboxes?: boolean;
  collapseByDefault?: boolean;
}

export function SwimLane({
  lane,
  columns,
  getLeadsForColumn,
  isOver = false,
  cardSize = 'medium',
  cardLayout = 'detailed',
  onLeadClick,
  onLeadSelect,
  showSelectCheckboxes = false,
  collapseByDefault = false
}: SwimLaneProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapseByDefault || lane.group.isCollapsed);
  const { setNodeRef } = useDroppable({
    id: `swimlane-${lane.group.id}`,
    data: {
      type: 'swimlane',
      lane: lane
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={cn(
        "mb-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200",
        isOver && "border-blue-400 bg-blue-50 shadow-md"
      )}
    >
      {/* Lane Header */}
      <SwimLaneHeader
        group={lane.group}
        metrics={lane.metrics}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Lane Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={setNodeRef}
            className="overflow-hidden"
          >
            {/* Columns grid */}
            <div className="flex space-x-4 p-4 overflow-x-auto">
              {columns
                .filter(col => col.isActive)
                .sort((a, b) => a.order - b.order)
                .map(column => {
                  const columnLeads = getLeadsForColumn(column.id, lane.group.id);
                  const leadIds = columnLeads.map(lead => lead.id);

                  return (
                    <div 
                      key={column.id} 
                      className="flex-shrink-0"
                      style={{ width: `${cardSize === 'small' ? 240 : cardSize === 'large' ? 320 : 280}px` }}
                    >
                      {/* Column in swim lane */}
                      <div className="bg-white rounded-lg border border-gray-200 min-h-[200px] p-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: column.color }}
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {column.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {columnLeads.length}
                          </span>
                        </div>

                        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {columnLeads.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 text-xs">
                                <div className="text-2xl mb-1">📋</div>
                                <p>Aucun lead</p>
                              </div>
                            ) : (
                              columnLeads.map((lead) => (
                                <KanbanCard
                                  key={lead.id}
                                  lead={lead}
                                  cardSize={cardSize}
                                  cardLayout={cardLayout}
                                  onDoubleClick={onLeadClick}
                                  onSelect={onLeadSelect}
                                  showSelectCheckbox={showSelectCheckboxes}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

