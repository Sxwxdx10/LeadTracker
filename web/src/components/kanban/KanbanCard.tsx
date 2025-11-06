'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { KanbanLead } from '@/types/kanban';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  getInitials, 
  getPriorityColor, 
  getStatusColor, 
  getCardColor,
  getTaskProgress,
  isLeadOverdue,
  getPriorityBadgeVariant
} from '@/utils/cardUtils';
import { 
  UserIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KanbanCardProps {
  lead: KanbanLead;
  isDragging?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  cardLayout?: 'compact' | 'detailed';
  onDoubleClick?: (lead: KanbanLead) => void;
  onSelect?: (leadId: string, selected: boolean) => void;
  showSelectCheckbox?: boolean;
}

export function KanbanCard({ 
  lead, 
  isDragging = false, 
  cardSize = 'medium',
  cardLayout = 'detailed',
  onDoubleClick,
  onSelect,
  showSelectCheckbox = false
}: KanbanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: lead.id,
    disabled: false
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = isLeadOverdue(lead);
  const hasTasks = lead.taskCount > 0;
  const taskProgress = getTaskProgress(lead);
  const cardColor = getCardColor(lead);
  const initials = lead.initials || getInitials(lead.assignedUserName || lead.contactName);

  // Card size classes
  const cardSizeClasses = {
    small: 'p-2 text-xs',
    medium: 'p-3 text-sm',
    large: 'p-4 text-base'
  };

  const iconSizeClasses = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(lead);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelectChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(lead.id, !lead.isSelected);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Support Ctrl/Cmd + Click for multi-select
    if ((e.ctrlKey || e.metaKey) && onSelect) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(lead.id, !lead.isSelected);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onDoubleClick={handleDoubleClick}
      onClick={handleCardClick}
      className={cn(
        "bg-white rounded-lg border-2 shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 relative overflow-hidden",
        isDragging || isSortableDragging 
          ? "shadow-xl scale-105 rotate-1 opacity-90 z-50" 
          : "hover:shadow-lg",
        isOverdue && "border-red-300 bg-red-50",
        lead.isSelected && "ring-2 ring-blue-500 ring-offset-2",
        cardSizeClasses[cardSize]
      )}
    >
      {/* Monday.com Style: Color Bar on Left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: cardColor }}
      />

      {/* Selection Checkbox */}
      {showSelectCheckbox && (
        <div 
          className="absolute top-2 right-2 z-10"
          onClick={handleSelectChange}
        >
          <input
            type="checkbox"
            checked={lead.isSelected || false}
            onChange={() => {}}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Compact Layout */}
      {cardLayout === 'compact' ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {lead.title}
              </h4>
              {lead.company && (
                <p className="text-xs text-gray-500 truncate flex items-center">
                  <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                  {lead.company}
                </p>
              )}
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center space-x-1 flex-shrink-0">
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
          <div className="flex items-center justify-between">
            {lead.estimatedValue && (
              <div className="flex items-center font-medium text-gray-900">
                <CurrencyEuroIcon className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(lead.estimatedValue)}
              </div>
            )}
            <Badge 
              variant={getPriorityBadgeVariant(lead.probability)}
              className="text-xs"
            >
              {lead.probability}%
            </Badge>
          </div>

          {/* Footer: User & Date */}
          <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
            {lead.assignedUserName && (
              <div className="flex items-center">
                {lead.avatar || initials ? (
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs mr-1">
                    {initials}
                  </div>
                ) : (
                  <UserIcon className="h-4 w-4 mr-1" />
                )}
                <span className="truncate">{lead.assignedUserName}</span>
              </div>
            )}
            {lead.expectedCloseDate && (
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span className={cn(isOverdue && "text-red-600 font-medium")}>
                  {formatDate(lead.expectedCloseDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed Layout */
        <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate mb-1">
              {lead.title}
            </h4>
            {lead.contactName && (
                <p className="text-sm text-gray-600 truncate mb-1">
                {lead.contactName}
              </p>
            )}
            {lead.company && (
                <p className="text-xs text-gray-500 truncate flex items-center">
                  <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                {lead.company}
              </p>
            )}
          </div>
          
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
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
          <div className="flex items-center justify-between">
          {lead.estimatedValue && (
              <div className="flex items-center font-medium text-gray-900">
              <CurrencyEuroIcon className="h-4 w-4 text-gray-400 mr-1" />
                {formatCurrency(lead.estimatedValue)}
            </div>
          )}
          
          <Badge 
              variant={getPriorityBadgeVariant(lead.probability)}
            className="text-xs"
          >
            {lead.probability}%
          </Badge>
        </div>

        {/* Tasks Progress */}
        {hasTasks && (
            <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Tâches</span>
              <span>{lead.completedTaskCount}/{lead.taskCount}</span>
            </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                >
                  <HashtagIcon className="h-3 w-3 mr-0.5" />
                  {tag}
                </span>
              ))}
              {lead.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{lead.tags.length - 3}</span>
              )}
            </div>
          )}

        {/* Due Date */}
        {lead.expectedCloseDate && (
            <div className="flex items-center text-xs text-gray-600">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span className={cn(
              isOverdue && "text-red-600 font-medium"
            )}>
              Échéance: {formatDate(lead.expectedCloseDate)}
            </span>
          </div>
        )}

          {/* Assigned User with Avatar */}
        {lead.assignedUserName && (
            <div className="flex items-center text-xs text-gray-600">
              {lead.avatar || initials ? (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs mr-2">
                  {initials}
                </div>
              ) : (
            <UserIcon className="h-3 w-3 mr-1" />
              )}
            <span>{lead.assignedUserName}</span>
          </div>
        )}

          {/* Last Contact */}
          {lead.lastContactedAt && (
            <div className="flex items-center text-xs text-gray-600">
              <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
              <span>Dernier contact: {formatDate(lead.lastContactedAt)}</span>
            </div>
          )}

        {/* Expandable Details */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t pt-3 mt-3 space-y-2 text-xs text-gray-600"
            >
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
              <div>
                <span className="font-medium">Créé:</span> {formatDate(lead.createdAt)}
              </div>
              {lead.notes && (
                <div className="pt-2 border-t">
                  <span className="font-medium">Notes:</span>
                  <p className="mt-1 text-gray-700">{lead.notes}</p>
            </div>
              )}
            </motion.div>
          )}

          {/* Expand/Collapse Button */}
          {!onDoubleClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Masquer' : 'Détails'}
            </Button>
          )}
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && !isDragging && !isSortableDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"
        />
      )}
    </motion.div>
  );
}
