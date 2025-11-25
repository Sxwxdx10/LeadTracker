'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SwimLaneGroup, SwimLaneMetrics } from '@/types/swimlanes';
import { formatCurrency, formatPercentage } from '@/utils/cardUtils';
import { Avatar } from '@/components/ui/Avatar';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SwimLaneHeaderProps {
  group: SwimLaneGroup;
  metrics: SwimLaneMetrics;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SwimLaneHeader({
  group,
  metrics,
  isCollapsed,
  onToggleCollapse
}: SwimLaneHeaderProps) {
  return (
    <motion.button
      onClick={onToggleCollapse}
      className={cn(
        "w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors",
        "border-b border-gray-200"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Left: Icon and Name */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Collapse Icon */}
        <div className="flex-shrink-0">
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Group Icon/Avatar */}
        <div className="flex-shrink-0">
          {group.icon ? (
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: group.color }}
            >
              <span className="text-sm">{group.icon}</span>
            </div>
          ) : group.color ? (
            <div 
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: group.color }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <UserGroupIcon className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Group Name and Label */}
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-gray-900 truncate">
            {group.name}
          </h3>
          {group.label && group.label !== group.name && (
            <p className="text-xs text-gray-500 truncate">
              {group.label}
            </p>
          )}
        </div>
      </div>

      {/* Right: Metrics */}
      <div className="flex items-center space-x-6 flex-shrink-0">
        {/* Count */}
        <div className="flex items-center space-x-1">
          <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-brand-600">
              {group.count}
            </span>
          </div>
        </div>

        {/* Total Value */}
        {metrics.totalValue > 0 && (
          <div className="flex items-center space-x-1 text-gray-700">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {formatCurrency(metrics.totalValue)}
            </span>
          </div>
        )}

        {/* Potential Value */}
        {metrics.potentialValue > 0 && (
          <div className="flex items-center space-x-1 text-gray-600">
            <ChartBarIcon className="h-4 w-4 text-gray-400" />
            <span className="text-xs">
              {formatCurrency(metrics.potentialValue)}
            </span>
          </div>
        )}

        {/* Average Probability */}
        {metrics.averageProbability > 0 && (
          <div className="hidden md:flex items-center space-x-1 text-gray-600">
            <span className="text-xs font-medium">
              {formatPercentage(metrics.averageProbability)}
            </span>
          </div>
        )}

        {/* Color indicator */}
        {group.color && (
          <div 
            className="h-6 w-6 rounded border-2 border-gray-300"
            style={{ backgroundColor: group.color }}
          />
        )}
      </div>
    </motion.button>
  );
}

// Specialized headers for different lane types
export function AssigneeSwimLaneHeader({ 
  group, 
  metrics, 
  isCollapsed, 
  onToggleCollapse 
}: SwimLaneHeaderProps & { userId?: string; avatar?: string }) {
  return (
    <SwimLaneHeader
      group={group}
      metrics={metrics}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}

export function PrioritySwimLaneHeader({ 
  group, 
  metrics, 
  isCollapsed, 
  onToggleCollapse 
}: SwimLaneHeaderProps) {
  return (
    <SwimLaneHeader
      group={group}
      metrics={metrics}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}

