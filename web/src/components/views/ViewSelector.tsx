'use client';

import React from 'react';
import { ViewType, VIEW_CONFIGS } from '@/types/views';
import { cn } from '@/lib/utils';
import { 
  Squares2X2Icon,
  TableCellsIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

const iconMap = {
  kanban: Squares2X2Icon,
  table: TableCellsIcon,
  timeline: ChartBarIcon,
  calendar: CalendarIcon,
};

export function ViewSelector({ currentView, onViewChange, className }: ViewSelectorProps) {
  return (
    <div className={cn(
      "flex items-center bg-gray-100 rounded-lg p-1",
      className
    )}>
      {VIEW_CONFIGS.map((config) => {
        const Icon = iconMap[config.type];
        
        return (
          <button
            key={config.id}
            onClick={() => onViewChange(config.type)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
              "hover:bg-white hover:shadow-sm",
              currentView === config.type
                ? "bg-white shadow-sm text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            )}
            title={config.description}
            aria-label={`Basculer vers la vue ${config.name}`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{config.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// Quick view switcher (icon only)
export function ViewSwitcher({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex items-center space-x-1">
      {VIEW_CONFIGS.map((config) => {
        const Icon = iconMap[config.type];
        
        return (
          <button
            key={config.id}
            onClick={() => onViewChange(config.type)}
            className={cn(
              "p-2 rounded-md transition-all duration-200",
              "hover:bg-gray-200",
              currentView === config.type
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            title={config.name}
            aria-label={`Basculer vers la vue ${config.name}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}

