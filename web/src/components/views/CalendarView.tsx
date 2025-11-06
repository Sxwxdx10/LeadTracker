'use client';

import React, { useState } from 'react';
import { Lead } from '@/types/lead';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface CalendarViewProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

type CalendarMode = 'month' | 'week' | 'day';

export function CalendarView({ leads, onLeadClick }: CalendarViewProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (calendarMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getLeadsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return leads.filter(lead => {
      if (!lead.expectedCloseDate) return false;
      const leadDate = new Date(lead.expectedCloseDate);
      return (
        leadDate.getDate() === date.getDate() &&
        leadDate.getMonth() === date.getMonth() &&
        leadDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const today = new Date();
  const monthDays = getMonthDays();
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          {/* Mode Selector */}
          <div className="flex items-center space-x-2">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setCalendarMode(mode as CalendarMode)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-colors capitalize",
                  calendarMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Date précédente"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Date suivante"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {calendarMode === 'month' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((date, index) => {
              const dateLeads = getLeadsForDate(date);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] border border-gray-200 rounded-lg p-2",
                    "hover:bg-gray-50 transition-colors",
                    isToday(date) && "border-blue-500 border-2 bg-blue-50",
                    !date && "bg-gray-50"
                  )}
                >
                  {date && (
                    <>
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday(date) && "text-blue-600"
                      )}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dateLeads.slice(0, 3).map((lead) => {
                          const statusColors = {
                            Open: 'bg-blue-100 text-blue-800 border-blue-200',
                            InProgress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            Qualified: 'bg-green-100 text-green-800 border-green-200',
                            Won: 'bg-green-200 text-green-900 border-green-300',
                            Lost: 'bg-red-100 text-red-800 border-red-200'
                          };

                          return (
                            <div
                              key={lead.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onLeadClick?.(lead);
                              }}
                              className={cn(
                                "text-xs p-1 rounded border cursor-pointer truncate",
                                statusColors[lead.status as keyof typeof statusColors] || 
                                'bg-gray-100 text-gray-800 border-gray-200'
                              )}
                              title={lead.title}
                            >
                              {lead.title}
                            </div>
                          );
                        })}
                        
                        {dateLeads.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dateLeads.length - 3} autres
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Placeholder for other modes */}
      {(calendarMode === 'week' || calendarMode === 'day') && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Mode {calendarMode === 'week' ? 'Semaine' : 'Jour'}</p>
            <p className="text-sm text-gray-400">
              En cours de développement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

