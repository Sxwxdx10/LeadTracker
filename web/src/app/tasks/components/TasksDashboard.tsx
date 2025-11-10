'use client';

import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ListBulletIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { TaskStats } from '@/hooks/useTasks';

interface TasksDashboardProps {
  stats: TaskStats;
  loading?: boolean;
}

export default function TasksDashboard({ stats, loading = false }: TasksDashboardProps) {
  const statsConfig = [
    {
      name: 'Total',
      value: stats.total,
      icon: ListBulletIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      name: 'Terminées',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'En cours',
      value: stats.inProgress,
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'En retard',
      value: stats.overdue,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: "Aujourd'hui",
      value: stats.today,
      icon: CalendarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsConfig.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                {loading ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
