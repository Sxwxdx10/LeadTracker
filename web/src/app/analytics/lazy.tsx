'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PageLoading } from '@/components/LazyPage';

// Lazy load des composants lourds
const AnalyticsCharts = dynamic(
  () => import('./components/AnalyticsCharts'),
  { 
    loading: () => <div className="animate-pulse h-80 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

const AnalyticsTable = dynamic(
  () => import('./components/AnalyticsTable'),
  { 
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

// Composant principal lazy-loaded
const LazyAnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Avancés</h1>
              <p className="text-sm text-gray-600">Analysez les performances de vos leads</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contenu lazy-loaded */}
        <AnalyticsCharts />
        <div className="mt-8">
          <AnalyticsTable />
        </div>
      </div>
    </div>
  );
};

// Export avec lazy loading
export default dynamic(() => Promise.resolve(LazyAnalyticsPage), {
  loading: () => <PageLoading message="Chargement des analytics..." />,
  ssr: false
});
