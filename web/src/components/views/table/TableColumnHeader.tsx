'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableColumnConfig } from '@/types/views';
import { 
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TableColumnHeaderProps {
  column: TableColumnConfig;
  sortConfig: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
  filterValue?: any;
  onFilter: (columnId: string, value: any) => void;
}

export function TableColumnHeader({
  column,
  sortConfig,
  onSort,
  filterValue,
  onFilter
}: TableColumnHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [localFilterValue, setLocalFilterValue] = useState(filterValue || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    disabled: false
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const isSorted = sortConfig?.field === column.field;
  const sortDirection = isSorted ? sortConfig.direction : null;

  const handleFilterChange = (value: string) => {
    setLocalFilterValue(value);
    onFilter(column.id, value);
  };

  const combinedStyle = {
    ...style,
    minWidth: column.minWidth,
    width: column.width
  };

  return (
    <th
      ref={setNodeRef}
      style={combinedStyle}
      className={cn(
        "px-4 py-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-20",
        column.align === 'right' && "text-right",
        column.align === 'center' && "text-center"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <Bars3Icon className="h-4 w-4 rotate-90" />
        </div>

        {/* Column Label */}
        <div className="flex-1">
          {column.sortable ? (
            <button
              onClick={() => onSort(column.field)}
              className="flex items-center gap-1 hover:text-brand-600 transition-colors"
            >
              <span className="font-semibold text-gray-700">{column.label}</span>
              {isSorted && (
                sortDirection === 'asc' ? (
                  <ChevronUpIcon className="h-4 w-4 text-brand-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-brand-600" />
                )
              )}
            </button>
          ) : (
            <span className="font-semibold text-gray-700">{column.label}</span>
          )}
        </div>

        {/* Filter Button */}
        {column.filterable && (
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={cn(
                "p-1 rounded hover:bg-gray-200 transition-colors",
                filterValue && "text-brand-600 bg-brand-50"
              )}
              aria-label={`Filtrer par ${column.label}`}
            >
              <FunnelIcon className="h-4 w-4" />
            </button>

            {/* Filter Dropdown */}
            {showFilter && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-30 min-w-[200px]">
                <input
                  type="text"
                  placeholder={`Filtrer ${column.label.toLowerCase()}...`}
                  value={localFilterValue}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                {filterValue && (
                  <button
                    onClick={() => {
                      setLocalFilterValue('');
                      handleFilterChange('');
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Effacer le filtre
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resize Handle */}
        {column.resizable && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = column.width ?? column.minWidth ?? 100;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const diff = moveEvent.clientX - startX;
                const newWidth = Math.max(
                  column.minWidth || 100,
                  Math.min(column.maxWidth || 500, startWidth + diff)
                );
                // Update column width (would need to be passed up to parent)
                console.log('Resize to:', newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        )}
      </div>
    </th>
  );
}

