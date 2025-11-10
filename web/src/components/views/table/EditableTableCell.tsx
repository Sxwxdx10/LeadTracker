'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TableColumnConfig } from '@/types/views';
import { Lead } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  CheckIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface EditableTableCellProps {
  lead: Lead;
  column: TableColumnConfig;
  isEditing: boolean;
  onEdit: (value: any) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

export function EditableTableCell({
  lead,
  column,
  isEditing,
  onEdit,
  onStartEdit,
  onCancelEdit
}: EditableTableCellProps) {
  const [editValue, setEditValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const leadValue = (lead as any)[column.field];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setEditValue(leadValue || '');
      inputRef.current.focus();
      // Only call select() for input elements (not select dropdowns)
      if (inputRef.current instanceof HTMLInputElement && 'select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing, leadValue]);

  const handleSave = () => {
    let processedValue: any = editValue;

    // Convert based on type
    if (column.type === 'number') {
      processedValue = Number(editValue) || 0;
    } else if (column.type === 'date') {
      processedValue = editValue || null;
    }

    onEdit(processedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  // Render based on column type
  const renderValue = () => {
    if (column.formatter && leadValue !== undefined && leadValue !== null) {
      return column.formatter(leadValue);
    }

    switch (column.type) {
      case 'number':
        return leadValue?.toLocaleString('fr-FR') || '-';
      
      case 'date':
        return leadValue ? formatDate(leadValue) : '-';
      
      case 'status':
        const statusColors: Record<string, string> = {
          'Open': 'bg-blue-100 text-blue-800',
          'InProgress': 'bg-yellow-100 text-yellow-800',
          'Qualified': 'bg-green-100 text-green-800',
          'Won': 'bg-green-200 text-green-900',
          'Lost': 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={cn(statusColors[leadValue] || 'bg-gray-100 text-gray-800')}>
            {leadValue || '-'}
          </Badge>
        );
      
      case 'text':
      default:
        return leadValue || '-';
    }
  };

  if (!column.editable) {
    return (
      <div className="min-h-[24px] flex items-center">
        {renderValue()}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {column.type === 'number' ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 border border-blue-500 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : column.type === 'date' ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 border border-blue-500 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : column.type === 'status' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 border border-blue-500 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Open">Ouvert</option>
            <option value="InProgress">En cours</option>
            <option value="Qualified">Qualifié</option>
            <option value="Won">Gagné</option>
            <option value="Lost">Perdu</option>
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 border border-blue-500 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          aria-label="Enregistrer"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={onCancelEdit}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          aria-label="Annuler"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onStartEdit}
      className="min-h-[24px] flex items-center cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 group"
    >
      <span className="flex-1">{renderValue()}</span>
      <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 ml-2" />
    </div>
  );
}

