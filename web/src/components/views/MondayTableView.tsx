'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Lead } from '@/types/lead';
import { TableColumnConfig } from '@/types/views';
import { EditableTableCell } from './table/EditableTableCell';
import { TableColumnHeader } from './table/TableColumnHeader';
import { TableRowGroup } from './table/TableRowGroup';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/ui/pagination';

interface MondayTableViewProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onLeadDelete?: (leadId: string) => Promise<void>;
  // Pagination props
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  // Sort props for server-side sorting
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
}

// Default columns configuration
const defaultColumns: TableColumnConfig[] = [
  {
    id: 'title',
    label: 'Lead',
    type: 'text',
    field: 'title',
    width: 250,
    minWidth: 150,
    maxWidth: 400,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'left'
  },
  {
    id: 'contact',
    label: 'Contact',
    type: 'text',
    field: 'firstName',
    width: 200,
    minWidth: 120,
    maxWidth: 300,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'left'
  },
  {
    id: 'company',
    label: 'Entreprise',
    type: 'text',
    field: 'company',
    width: 180,
    minWidth: 120,
    maxWidth: 300,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'left'
  },
  {
    id: 'estimatedValue',
    label: 'Valeur',
    type: 'number',
    field: 'estimatedValue',
    width: 120,
    minWidth: 100,
    maxWidth: 200,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'right',
    formatter: (value) => formatCurrency(value as number)
  },
  {
    id: 'probability',
    label: 'Probabilité',
    type: 'number',
    field: 'probability',
    width: 120,
    minWidth: 100,
    maxWidth: 150,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'center',
    formatter: (value) => `${value}%`
  },
  {
    id: 'status',
    label: 'Statut',
    type: 'status',
    field: 'status',
    width: 130,
    minWidth: 100,
    maxWidth: 200,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'center'
  },
  {
    id: 'expectedCloseDate',
    label: 'Date prévue',
    type: 'date',
    field: 'expectedCloseDate',
    width: 140,
    minWidth: 120,
    maxWidth: 200,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: true,
    visible: true,
    align: 'left',
    formatter: (value) => formatDate(value as string)
  },
  {
    id: 'createdAt',
    label: 'Créé le',
    type: 'date',
    field: 'createdAt',
    width: 140,
    minWidth: 120,
    maxWidth: 200,
    resizable: true,
    sortable: true,
    filterable: true,
    editable: false,
    visible: true,
    align: 'left',
    formatter: (value) => formatDate(value as string)
  }
];

export function MondayTableView({
  leads,
  onLeadClick,
  onLeadUpdate,
  onLeadDelete,
  totalCount,
  currentPage = 1,
  totalPages = 1,
  hasNextPage = false,
  hasPreviousPage = false,
  onPageChange,
  onPageSizeChange,
  pageSize = 25,
  sortBy: serverSortBy,
  sortDirection: serverSortDirection,
  onSortChange
}: MondayTableViewProps) {
  const [columns, setColumns] = useState<TableColumnConfig[]>(defaultColumns);
  // Use server-side sort if provided, otherwise use local state
  const sortConfig = serverSortBy && serverSortDirection 
    ? { field: serverSortBy, direction: serverSortDirection }
    : null;
  const [localSortConfig, setLocalSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Determine which sort config to use
  const effectiveSortConfig = sortConfig || localSortConfig;
  const [groupingField, setGroupingField] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);

  // Handle column reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setColumns((prev) => {
      const oldIndex = prev.findIndex(col => col.id === active.id);
      const newIndex = prev.findIndex(col => col.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newColumns = [...prev];
      const [removed] = newColumns.splice(oldIndex, 1);
      if (removed) {
        newColumns.splice(newIndex, 0, removed);
      }
      
      return newColumns;
    });
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const currentField = effectiveSortConfig?.field;
    const currentDirection = effectiveSortConfig?.direction;
    const newDirection = currentField === field && currentDirection === 'asc' ? 'desc' : 'asc';
    
    // If we have server-side sorting (pagination), notify parent to update server-side
    if (onSortChange && totalCount !== undefined) {
      onSortChange(field, newDirection);
    } else {
      // Otherwise, use local client-side sorting
      setLocalSortConfig({ field, direction: newDirection });
    }
  };

  // Sorted leads - only sort client-side if no pagination info provided (meaning data is already sorted server-side)
  const sortedLeads = useMemo(() => {
    // If we have pagination info, data is already sorted server-side - don't sort again
    if (totalCount !== undefined && currentPage !== undefined && sortConfig) {
      return leads;
    }
    
    // Otherwise, sort client-side using local sort config
    if (!effectiveSortConfig) return leads;
    
    return [...leads].sort((a, b) => {
      const aValue = (a as any)[effectiveSortConfig.field];
      const bValue = (b as any)[effectiveSortConfig.field];
      
      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      const comparison = aValue < bValue ? -1 : 1;
      return effectiveSortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [leads, effectiveSortConfig, totalCount, currentPage, sortConfig]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return sortedLeads.filter(lead => {
      return Object.entries(columnFilters).every(([columnId, filterValue]) => {
        if (!filterValue) return true;
        
        const column = columns.find(col => col.id === columnId);
        if (!column || !column.field) return true;
        
        const leadValue = (lead as any)[column.field];
        const value = String(leadValue || '').toLowerCase();
        const filter = String(filterValue).toLowerCase();
        
        return value.includes(filter);
      });
    });
  }, [sortedLeads, columnFilters, columns]);

  // Grouped leads
  const groupedLeads = useMemo(() => {
    if (!groupingField) {
      return { '': filteredLeads };
    }

    const groups: Record<string, Lead[]> = {};
    
    filteredLeads.forEach(lead => {
      const groupKey = String((lead as any)[groupingField] || 'Sans groupe');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(lead);
    });

    return groups;
  }, [filteredLeads, groupingField]);

  // Handle cell edit
  const handleCellEdit = async (leadId: string, columnId: string, value: any) => {
    const column = columns.find(col => col.id === columnId);
    if (!column || !onLeadUpdate) {
      setEditingCell(null);
      return;
    }

    const updates = { [column.field]: value };
    await onLeadUpdate(leadId, updates);
    setEditingCell(null);
  };

  // Handle column filter
  const handleColumnFilter = (columnId: string, value: any) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: value || undefined
    }));
  };

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Select all
  const selectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const visibleColumns = columns.filter(col => col.visible);
  const columnIds = visibleColumns.map(col => col.id);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            {selectedLeads.size === filteredLeads.length ? 'Désélectionner tout' : 'Sélectionner tout'}
          </Button>
          
          {selectedLeads.size > 0 && (
            <span className="text-sm text-gray-600">
              {selectedLeads.size} sélectionné{selectedLeads.size > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={groupingField || ''}
            onChange={(e) => setGroupingField(e.target.value || null)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Pas de regroupement</option>
            {columns
              .filter(col => col.type === 'status' || col.type === 'text')
              .map(col => (
                <option key={col.id} value={col.field}>
                  Grouper par {col.label}
                </option>
              ))}
          </select>

          <Button variant="outline" size="sm">
            <ViewColumnsIcon className="h-4 w-4 mr-2" />
            Colonnes
          </Button>

          <Button variant="outline" size="sm">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 overflow-auto">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="min-w-full">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {/* Checkbox column */}
                    <th className="px-4 py-3 border-b border-gray-200 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={selectAll}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </th>

                    {/* Column headers */}
                    {visibleColumns.map((column) => (
                      <TableColumnHeader
                        key={column.id}
                        column={column}
                        sortConfig={effectiveSortConfig}
                        onSort={handleSort}
                        filterValue={columnFilters[column.id]}
                        onFilter={handleColumnFilter}
                      />
                    ))}

                    {/* Actions column */}
                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedLeads).map(([groupKey, groupLeads]) => {
                    if (groupingField && groupKey !== '') {
                      const isExpanded = expandedGroups.has(groupKey);
                      
                      return (
                        <TableRowGroup
                          key={groupKey}
                          groupKey={groupKey}
                          leads={groupLeads}
                          columns={visibleColumns}
                          isExpanded={isExpanded}
                          onToggle={() => toggleGroup(groupKey)}
                          selectedLeads={selectedLeads}
                          onToggleLead={toggleLeadSelection}
                          editingCell={editingCell}
                          onCellEdit={handleCellEdit}
                          onStartEdit={(rowId, columnId) => setEditingCell({ rowId, columnId })}
                          onCancelEdit={() => setEditingCell(null)}
                          {...(onLeadClick && { onLeadClick })}
                          {...(onLeadDelete && { onLeadDelete })}
                        />
                      );
                    }

                    // No grouping - render rows directly
                    return groupLeads.map((lead) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "hover:bg-gray-50 border-b border-gray-100",
                          selectedLeads.has(lead.id) && "bg-brand-50"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>

                        {/* Data cells */}
                        {visibleColumns.map((column) => (
                          <td
                            key={column.id}
                            className={cn(
                              "px-4 py-3",
                              column.align === 'right' && "text-right",
                              column.align === 'center' && "text-center"
                            )}
                            style={{ minWidth: column.minWidth, width: column.width }}
                          >
                            <EditableTableCell
                              lead={lead}
                              column={column}
                              isEditing={editingCell?.rowId === lead.id && editingCell?.columnId === column.id}
                              onEdit={(value) => handleCellEdit(lead.id, column.id, value)}
                              onStartEdit={() => setEditingCell({ rowId: lead.id, columnId: column.id })}
                              onCancelEdit={() => setEditingCell(null)}
                            />
                          </td>
                        ))}

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {onLeadClick && (
                              <button
                                onClick={() => onLeadClick(lead)}
                                className="text-brand-600 hover:text-brand-700 text-sm"
                              >
                                Voir
                              </button>
                            )}
                            {onLeadDelete && (
                              <button
                                onClick={() => onLeadDelete(lead.id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ));
                  })}

                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={visibleColumns.length + 2} className="px-4 py-12 text-center text-gray-500">
                        Aucun lead trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SortableContext>
          </div>
        </DndContext>
      </div>

      {/* Footer with pagination */}
      {totalCount !== undefined && onPageChange && totalPages > 1 ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
              {totalCount !== undefined && filteredLeads.length !== totalCount && ` sur ${totalCount} total`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

