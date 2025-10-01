'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanLead } from '@/types/kanban';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  UserIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KanbanCardProps {
  lead: KanbanLead;
  isDragging?: boolean;
}

export function KanbanCard({ lead, isDragging = false }: KanbanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = lead.isOverdue && lead.status !== 'Won';
  const hasTasks = lead.taskCount > 0;
  const taskProgress = lead.taskCount > 0 ? (lead.completedTaskCount / lead.taskCount) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200",
        isDragging || isSortableDragging 
          ? "shadow-lg scale-105 rotate-2 opacity-95" 
          : "hover:shadow-md",
        isOverdue && "border-red-300 bg-red-50"
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {lead.title}
            </h4>
            {lead.contactName && (
              <p className="text-sm text-gray-600 truncate">
                {lead.contactName}
              </p>
            )}
            {lead.company && (
              <p className="text-xs text-gray-500 truncate">
                {lead.company}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {isOverdue && (
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            )}
            {lead.status === 'Won' && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
            {lead.status === 'Lost' && (
              <div className="h-4 w-4 rounded-full bg-red-500" />
            )}
          </div>
        </div>

        {/* Value and Probability */}
        <div className="flex items-center justify-between mb-3">
          {lead.estimatedValue && (
            <div className="flex items-center text-sm">
              <CurrencyEuroIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="font-medium text-gray-900">
                {formatCurrency(lead.estimatedValue)}
              </span>
            </div>
          )}
          
          <Badge 
            variant={lead.probability >= 70 ? "default" : lead.probability >= 40 ? "secondary" : "outline"}
            className="text-xs"
          >
            {lead.probability}%
          </Badge>
        </div>

        {/* Tasks Progress */}
        {hasTasks && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Tâches</span>
              <span>{lead.completedTaskCount}/{lead.taskCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Due Date */}
        {lead.expectedCloseDate && (
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span className={cn(
              isOverdue && "text-red-600 font-medium"
            )}>
              Échéance: {formatDate(lead.expectedCloseDate)}
            </span>
          </div>
        )}

        {/* Assigned User */}
        {lead.assignedUserName && (
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <UserIcon className="h-3 w-3 mr-1" />
            <span>{lead.assignedUserName}</span>
          </div>
        )}

        {/* Expandable Details */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Masquer' : 'Détails'}
          </Button>
          
          {isExpanded && (
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              {lead.email && (
                <div>
                  <span className="font-medium">Email:</span> {lead.email}
                </div>
              )}
              {lead.phoneNumber && (
                <div>
                  <span className="font-medium">Téléphone:</span> {lead.phoneNumber}
                </div>
              )}
              {lead.lastContactedAt && (
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>Dernier contact: {formatDate(lead.lastContactedAt)}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Créé:</span> {formatDate(lead.createdAt)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
