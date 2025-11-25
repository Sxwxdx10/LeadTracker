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

  const getWeekDays = () => {
    const date = new Date(currentDate);
    // Get Monday of the current week (lundi = premier jour en France)
    // JavaScript getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want Monday to be the first day, so we adjust:
    // If it's Sunday (0), we go back 6 days, otherwise we go back (day - 1) days
    const day = date.getDay();
    const diff = date.getDate() - (day === 0 ? 6 : day - 1); // Adjust for Monday as first day
    const monday = new Date(date);
    monday.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    
    return weekDays;
  };

  const getDayLeads = () => {
    return getLeadsForDate(currentDate);
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
  const weekDays = getWeekDays();
  const dayLeads = getDayLeads();
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const dayNamesFull = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

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
            {calendarMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {calendarMode === 'week' && (() => {
              const firstDay = weekDays[0];
              const lastDay = weekDays[6];
              if (firstDay.getMonth() === lastDay.getMonth()) {
                return `${firstDay.getDate()}-${lastDay.getDate()} ${monthNames[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
              } else {
                return `${firstDay.getDate()} ${monthNames[firstDay.getMonth()]} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()]} ${firstDay.getFullYear()}`;
              }
            })()}
            {calendarMode === 'day' && `${dayNamesFull[currentDate.getDay()]} ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
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
                    ? "bg-brand-600 text-white"
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
            className="px-3 py-1 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700 transition-colors"
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
                    isToday(date) && "border-brand-500 border-2 bg-brand-50",
                    !date && "bg-gray-50"
                  )}
                >
                  {date && (
                    <>
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday(date) && "text-brand-600"
                      )}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dateLeads.slice(0, 3).map((lead) => {
                          const statusColors = {
                            Open: 'bg-brand-100 text-brand-800 border-brand-200',
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

      {/* Week View */}
      {calendarMode === 'week' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((date) => (
              <div 
                key={date.toISOString()} 
                className={cn(
                  "text-center text-sm font-semibold py-2 border-b-2",
                  isToday(date) 
                    ? "text-brand-600 border-brand-500" 
                    : "text-gray-600 border-gray-200"
                )}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {dayNames[date.getDay()]}
                </div>
                <div className={cn(
                  "text-lg font-bold",
                  isToday(date) && "text-brand-600"
                )}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date) => {
              const dateLeads = getLeadsForDate(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "min-h-[400px] border border-gray-200 rounded-lg p-2",
                    "hover:bg-gray-50 transition-colors",
                    isToday(date) && "border-brand-500 border-2 bg-brand-50"
                  )}
                >
                  <div className="space-y-1">
                    {dateLeads.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-4">
                        Aucun lead
                      </div>
                    ) : (
                      dateLeads.map((lead) => {
                        const statusColors = {
                          Open: 'bg-brand-100 text-brand-800 border-brand-200',
                          InProgress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          Qualified: 'bg-green-100 text-green-800 border-green-200',
                          Won: 'bg-green-200 text-green-900 border-green-300',
                          Lost: 'bg-red-100 text-red-800 border-red-200',
                          Cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
                        };

                        return (
                          <div
                            key={lead.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onLeadClick?.(lead);
                            }}
                            className={cn(
                              "text-xs p-2 rounded border cursor-pointer hover:shadow-md transition-shadow",
                              statusColors[lead.status as keyof typeof statusColors] || 
                              'bg-gray-100 text-gray-800 border-gray-200'
                            )}
                            title={lead.title}
                          >
                            <div className="font-medium truncate mb-1">
                              {lead.title}
                            </div>
                            {lead.company && (
                              <div className="text-xs opacity-75 truncate">
                                {lead.company}
                              </div>
                            )}
                            {lead.estimatedValue && (
                              <div className="text-xs font-semibold mt-1">
                                ${lead.estimatedValue.toLocaleString()}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {calendarMode === 'day' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <div className={cn(
                "text-center py-3 border-b-2 mb-4",
                isToday(currentDate) 
                  ? "border-brand-500" 
                  : "border-gray-200"
              )}>
                <div className="text-sm text-gray-500 mb-1">
                  {dayNamesFull[currentDate.getDay()]}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  isToday(currentDate) && "text-brand-600"
                )}>
                  {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
              </div>
            </div>

            {dayLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CalendarIcon className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">Aucun lead pour ce jour</p>
                <p className="text-sm text-gray-400">
                  Aucun lead n'a de date de clôture prévue pour cette date
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayLeads.map((lead) => {
                  const statusColors = {
                    Open: 'bg-brand-100 text-brand-800 border-brand-200',
                    InProgress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    Qualified: 'bg-green-100 text-green-800 border-green-200',
                    Won: 'bg-green-200 text-green-900 border-green-300',
                    Lost: 'bg-red-100 text-red-800 border-red-200',
                    Cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
                  };

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onLeadClick?.(lead)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all",
                        statusColors[lead.status as keyof typeof statusColors] || 
                        'bg-gray-100 text-gray-800 border-gray-200'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {lead.title}
                            </h3>
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded",
                              statusColors[lead.status as keyof typeof statusColors] || 
                              'bg-gray-200 text-gray-800'
                            )}>
                              {lead.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {lead.company && (
                              <div>
                                <span className="text-gray-500">Entreprise:</span>{' '}
                                <span className="font-medium">{lead.company}</span>
                              </div>
                            )}
                            {lead.email && (
                              <div>
                                <span className="text-gray-500">Email:</span>{' '}
                                <span className="font-medium">{lead.email}</span>
                              </div>
                            )}
                            {lead.phoneNumber && (
                              <div>
                                <span className="text-gray-500">Téléphone:</span>{' '}
                                <span className="font-medium">{lead.phoneNumber}</span>
                              </div>
                            )}
                            {lead.estimatedValue !== undefined && (
                              <div>
                                <span className="text-gray-500">Valeur estimée:</span>{' '}
                                <span className="font-medium">${lead.estimatedValue.toLocaleString()}</span>
                              </div>
                            )}
                            {lead.probability !== undefined && (
                              <div>
                                <span className="text-gray-500">Probabilité:</span>{' '}
                                <span className="font-medium">{lead.probability}%</span>
                              </div>
                            )}
                            {lead.source && (
                              <div>
                                <span className="text-gray-500">Source:</span>{' '}
                                <span className="font-medium">{lead.source}</span>
                              </div>
                            )}
                          </div>
                          
                          {lead.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {lead.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

