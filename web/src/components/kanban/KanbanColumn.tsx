'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { formatCurrency, formatDays, formatPercentage } from '@/utils/cardUtils';
import { cn } from '@/lib/utils';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Bars3Icon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: KanbanLead[];
  isOver?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  cardLayout?: 'compact' | 'detailed';
  colorScheme?: 'default' | 'colorful' | 'minimal';
  columnWidth?: number;
  maxLeadsPerColumn?: number;
  onResize?: (columnId: string, width: number) => void;
  showWipLimit?: boolean;
  onLeadClick?: (lead: KanbanLead) => void;
  onLeadSelect?: (leadId: string, selected: boolean) => void;
  showSelectCheckboxes?: boolean;
}

export function KanbanColumnComponent({ 
  column, 
  leads, 
  isOver = false,
  cardSize = 'medium',
  cardLayout = 'detailed',
  colorScheme = 'default',
  columnWidth: propColumnWidth,
  maxLeadsPerColumn: propMaxLeadsPerColumn,
  onResize,
  showWipLimit = true,
  onLeadClick,
  onLeadSelect,
  showSelectCheckboxes = false
}: KanbanColumnProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [columnWidth, setColumnWidth] = useState(propColumnWidth || column.width || 320);
  const resizeRef = useRef<HTMLButtonElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Check WIP limit - use prop maxLeadsPerColumn if provided, otherwise column.wipLimit or default
  const wipLimit = propMaxLeadsPerColumn || column.wipLimit || 50;
  const displayedLeads = leads.slice(0, wipLimit);
  const isOverLimit = leads.length > wipLimit;
  const wipPercentage = wipLimit > 0 ? (leads.length / wipLimit) * 100 : 0;
  
  // Update column width when prop changes
  useEffect(() => {
    if (propColumnWidth !== undefined) {
      setColumnWidth(propColumnWidth);
    }
  }, [propColumnWidth]);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column: column
    }
  });

  const leadIds = displayedLeads.map(lead => lead.id);

  // Resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(240, Math.min(500, startWidthRef.current + diff));
      setColumnWidth(newWidth);
      
      if (onResize) {
        onResize(column.id, newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, column.id, onResize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidth;
  };

  return (
    <div 
      className="flex flex-col flex-shrink-0"
      style={{ width: `${columnWidth}px` }}
    >
      {/* Column Header */}
      <div className="rounded-lg p-4 mb-4 border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-gray-900 truncate">{column.name}</h3>
            
            {/* Count Badge */}
            <span className={cn(
              "text-xs px-2 py-1 rounded-full flex-shrink-0",
              isOverLimit 
                ? "bg-red-100 text-red-800 font-bold" 
                : "bg-gray-200 text-gray-700"
            )}>
              {leads.length}
              {wipLimit > 0 && `/${wipLimit}`}
            </span>
          </div>

          {/* Resize Handle */}
          {onResize && (
            <button
              ref={resizeRef}
              onMouseDown={handleResizeStart}
              className="ml-2 p-1 hover:bg-gray-200 rounded cursor-col-resize transition-colors flex-shrink-0"
              aria-label="Redimensionner la colonne"
            >
              <Bars3Icon className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* WIP Limit Indicator */}
        {showWipLimit && wipLimit > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Utilisation</span>
              <span className={cn(
                "font-medium",
                isOverLimit && "text-red-600"
              )}>
                {Math.round(wipPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div 
                className={cn(
                  "h-2 rounded-full transition-colors",
                  wipPercentage > 100 ? "bg-gradient-to-r from-red-400 to-red-600" :
                  wipPercentage > 80 ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
                  "bg-gradient-to-r from-green-400 to-green-600"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, wipPercentage)}%` }}
                transition={{ duration: 0.3 }}
              />
              {wipPercentage > 100 && (
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-red-600 to-red-700"
                  animate={{ width: `${wipPercentage - 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          </div>
        )}

        {/* Column Metrics */}
        {column.showValue || column.showCount || column.showAverageTime ? (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
            {column.showValue && (
              <>
          <div>
            <span className="font-medium">Valeur:</span>
            <br />
                  <span className="text-gray-900">{formatCurrency(column.totalValue)}</span>
          </div>
          <div>
            <span className="font-medium">Potentiel:</span>
            <br />
                  <span className="text-gray-900">{formatCurrency(column.potentialValue)}</span>
                </div>
              </>
            )}
            {column.showAverageTime && (
              <div>
                <span className="font-medium">Temps moyen:</span>
                <br />
                <span className="text-gray-900">{formatDays(column.averageTimeInStageDays)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
            <div>
              <span className="font-medium">Valeur:</span>
              <br />
              <span className="text-gray-900">{formatCurrency(column.totalValue)}</span>
            </div>
            <div>
              <span className="font-medium">Potentiel:</span>
              <br />
              <span className="text-gray-900">{formatCurrency(column.potentialValue)}</span>
          </div>
          <div>
            <span className="font-medium">Temps moyen:</span>
            <br />
              <span className="text-gray-900">{formatDays(column.averageTimeInStageDays)}</span>
          </div>
          <div>
            <span className="font-medium">Utilisation:</span>
            <br />
              <span className="text-gray-900">
                {column.wipLimit && column.wipLimit > 0 ? formatPercentage((column.leadCount / column.wipLimit) * 100) : '-'}
              </span>
            </div>
          </div>
        )}

        {/* Warning if over WIP limit */}
        {isOverLimit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center space-x-1 text-xs text-red-600 font-medium"
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Limite dépassée !</span>
          </motion.div>
        )}

        {/* Success indicator if efficient */}
        {!isOverLimit && wipPercentage < 50 && leads.length > 0 && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Équilibre optimal</span>
        </div>
        )}
      </div>

      {/* Column Content - Full Height Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-0 rounded-lg border-2 border-dashed transition-all duration-200 relative",
          isOver 
            ? "border-brand-500 bg-brand-100 shadow-lg scale-[1.02]" 
            : "border-gray-200 bg-gray-50",
          isResizing && "select-none"
        )}
        style={{ 
          borderColor: isOver ? column.color : undefined,
          backgroundColor: isOver ? `${column.color}20` : undefined,
          minHeight: '400px'
        }}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <div className="p-4 space-y-3 h-full overflow-y-auto min-h-0">
            {displayedLeads.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500 h-full flex flex-col justify-center"
              >
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">Aucun lead</p>
                <p className="text-xs text-gray-400">
                  Glissez-déposez des leads ici
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {displayedLeads.map((lead) => (
                  <KanbanCard 
                    key={lead.id} 
                    lead={lead} 
                    cardSize={cardSize}
                    cardLayout={cardLayout}
                    colorScheme={colorScheme}
                    columnColor={column.color}
                    {...(onLeadClick && { onDoubleClick: onLeadClick })}
                    {...(onLeadSelect && { onSelect: onLeadSelect })}
                    showSelectCheckbox={showSelectCheckboxes}
                  />
                ))}
                {isOverLimit && (
                  <div className="text-center py-2 text-xs text-orange-600 bg-orange-50 rounded border border-orange-200">
                    <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                    Limite atteinte ({leads.length - displayedLeads.length} lead{leads.length - displayedLeads.length > 1 ? 's' : ''} masqué{leads.length - displayedLeads.length > 1 ? 's' : ''})
                  </div>
                )}
              </div>
            )}
          </div>
        </SortableContext>

        {/* Resizing overlay */}
        {isResizing && (
          <div className="absolute inset-0 bg-brand-500/10 border-2 border-brand-500 rounded-lg pointer-events-none z-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-brand-500 text-white px-3 py-1 rounded shadow-lg text-sm font-medium">
                {columnWidth}px
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
