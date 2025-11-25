'use client';

import React, { useState } from 'react';
import { Lead } from '@/types/lead';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';

interface TimelineViewProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

type TimeScale = 'day' | 'week' | 'month' | 'quarter';

export function TimelineView({ leads, onLeadClick }: TimelineViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const scaleOptions = [
    { value: 'day' as TimeScale, label: 'Jour' },
    { value: 'week' as TimeScale, label: 'Semaine' },
    { value: 'month' as TimeScale, label: 'Mois' },
    { value: 'quarter' as TimeScale, label: 'Trimestre' },
  ];

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (timeScale) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate timeline bars for leads
  const getTimelineBars = () => {
    return leads
      .filter(lead => lead.expectedCloseDate)
      .map(lead => ({
        lead,
        startDate: new Date(lead.createdAt),
        endDate: new Date(lead.expectedCloseDate!),
        days: Math.ceil((new Date(lead.expectedCloseDate!).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  };

  const bars = getTimelineBars();

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
          
          {/* Time Scale Selector */}
          <div className="flex items-center space-x-2">
            {scaleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeScale(option.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-colors",
                  timeScale === option.value
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateTime('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Période précédente"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700 transition-colors"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={() => navigateTime('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Période suivante"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto p-4">
        {bars.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CalendarIcon className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Aucun lead avec date de clôture</p>
            <p className="text-sm text-gray-400">
              Ajoutez des dates de clôture aux leads pour les voir ici
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bars.map(({ lead, days, startDate, endDate }) => {
              const statusColors = {
                Open: 'bg-blue-500',
                InProgress: 'bg-yellow-500',
                Qualified: 'bg-green-500',
                Won: 'bg-green-600',
                Lost: 'bg-red-500'
              };

              return (
                <div
                  key={lead.id}
                  onClick={() => onLeadClick?.(lead)}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Timeline Bar */}
                  <div className="flex-1 relative h-12">
                    <div
                      className={cn(
                        "absolute h-full rounded-md flex items-center px-3 text-white text-sm font-medium shadow-sm",
                        statusColors[lead.status as keyof typeof statusColors] || 'bg-gray-500'
                      )}
                      style={{
                        left: '0%',
                        width: '100%',
                        minWidth: `${Math.max(100, days * 2)}px`
                      }}
                    >
                      {lead.title} - {formatDate(lead.expectedCloseDate)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-600">
                      {days} jour{days > 1 ? 's' : ''}
                    </span>
                    {lead.estimatedValue && (
                      <span className="text-sm font-semibold text-gray-900">
                        ${lead.estimatedValue.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-xs">
          <span className="font-medium text-gray-700">Légende:</span>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded bg-blue-500"></div>
            <span>Ouvert</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded bg-yellow-500"></div>
            <span>En cours</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded bg-green-500"></div>
            <span>Qualifié</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded bg-red-500"></div>
            <span>Perdu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

