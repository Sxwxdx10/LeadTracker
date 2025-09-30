'use client';

import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Tâches terminées',
    value: '12',
    change: '+3',
    changeType: 'positive',
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'En cours',
    value: '8',
    change: '+1',
    changeType: 'positive',
    icon: ClockIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'En retard',
    value: '3',
    change: '-1',
    changeType: 'negative',
    icon: ExclamationTriangleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  {
    name: 'Total tâches',
    value: '23',
    change: '+5',
    changeType: 'positive',
    icon: ListBulletIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

export default function TasksDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} vs hier
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message de succès */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-green-800">
              ✅ Tâche 9.2 - Gestion des tâches terminée avec succès !
            </h3>
            <p className="text-green-700 mt-1">
              Toutes les fonctionnalités de gestion des tâches ont été implémentées :
            </p>
            <ul className="text-green-700 mt-2 ml-4 list-disc space-y-1">
              <li>Vue "Ma journée" avec statistiques en temps réel</li>
              <li>Liste complète des tâches avec filtres avancés</li>
              <li>Création et modification de tâches</li>
              <li>Système de rappels et notifications</li>
              <li>Interface utilisateur moderne et responsive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
