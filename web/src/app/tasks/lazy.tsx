'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PageLoading } from '@/components/LazyPage';

// Lazy load des composants lourds
const TasksDashboard = dynamic(
  () => import('./components/TasksDashboard'),
  { 
    loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

const TasksList = dynamic(
  () => import('./components/TasksList'),
  { 
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

// Composant principal lazy-loaded
const LazyTasksPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Tâches</h1>
              <p className="text-sm text-gray-600">Organisez et suivez vos tâches quotidiennes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard lazy-loaded */}
        <TasksDashboard />
        
        {/* Liste des tâches lazy-loaded */}
        <div className="mt-8">
          <TasksList />
        </div>
      </div>
    </div>
  );
};

// Export avec lazy loading
export default dynamic(() => Promise.resolve(LazyTasksPage), {
  loading: () => <PageLoading message="Chargement des tâches..." />,
  ssr: false
});
