'use client';

import React from 'react';
import { 
  ChartBarIcon, 
  CurrencyEuroIcon, 
  ClockIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const metrics = [
  {
    name: 'Total Leads',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: UserGroupIcon,
  },
  {
    name: 'Taux de Conversion',
    value: '24.5%',
    change: '+2.1%',
    changeType: 'positive',
    icon: ChartBarIcon,
  },
  {
    name: 'Revenus Totaux',
    value: '€45,678',
    change: '+8.2%',
    changeType: 'positive',
    icon: CurrencyEuroIcon,
  },
  {
    name: 'Cycle de Vente Moyen',
    value: '28 jours',
    change: '-3 jours',
    changeType: 'positive',
    icon: ClockIcon,
  },
];

export default function ReportsMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.name} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <metric.icon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{metric.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
              <p className={`text-sm ${
                metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change} vs mois dernier
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
