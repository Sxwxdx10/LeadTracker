'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead } from '@/types/lead';
import { TableColumnConfig } from '@/types/views';
import { EditableTableCell } from './EditableTableCell';
import { 
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TableRowGroupProps {
  groupKey: string;
  leads: Lead[];
  columns: TableColumnConfig[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedLeads: Set<string>;
  onToggleLead: (leadId: string) => void;
  editingCell: { rowId: string; columnId: string } | null;
  onCellEdit: (leadId: string, columnId: string, value: any) => void;
  onStartEdit: (rowId: string, columnId: string) => void;
  onCancelEdit: () => void;
  onLeadClick?: (lead: Lead) => void;
  onLeadDelete?: (leadId: string) => Promise<void>;
}

export function TableRowGroup({
  groupKey,
  leads,
  columns,
  isExpanded,
  onToggle,
  selectedLeads,
  onToggleLead,
  editingCell,
  onCellEdit,
  onStartEdit,
  onCancelEdit,
  onLeadClick,
  onLeadDelete
}: TableRowGroupProps) {
  return (
    <>
      {/* Group Header */}
      <tr className="bg-gray-100 border-b border-gray-200">
        <td colSpan={columns.length + 2} className="px-4 py-2">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 w-full text-left hover:bg-gray-200 rounded px-2 py-1"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            )}
            <span className="font-semibold text-gray-700">{groupKey}</span>
            <span className="text-sm text-gray-500">({leads.length} lead{leads.length !== 1 ? 's' : ''})</span>
          </button>
        </td>
      </tr>

      {/* Group Rows */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={columns.length + 2}>
              <table className="w-full">
                <tbody>
                  {leads.map((lead) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "hover:bg-gray-50 border-b border-gray-100",
                        selectedLeads.has(lead.id) && "bg-blue-50"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => onToggleLead(lead.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Data cells */}
                      {columns.map((column) => (
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
                            onEdit={(value) => onCellEdit(lead.id, column.id, value)}
                            onStartEdit={() => onStartEdit(lead.id, column.id)}
                            onCancelEdit={onCancelEdit}
                          />
                        </td>
                      ))}

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {onLeadClick && (
                            <button
                              onClick={() => onLeadClick(lead)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
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
                  ))}
                </tbody>
              </table>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

