'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PageLoading } from '@/components/LazyPage';

// Lazy load des composants lourds
const ExportConfiguration = dynamic(
  () => import('./components/ExportConfiguration'),
  { 
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

const ExportPreview = dynamic(
  () => import('./components/ExportPreview'),
  { 
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

// Composant principal lazy-loaded
const LazyExportPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Export de Données</h1>
              <p className="text-sm text-gray-600">Exportez vos données dans différents formats</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration lazy-loaded */}
          <div className="lg:col-span-1">
            <ExportConfiguration />
          </div>
          
          {/* Aperçu lazy-loaded */}
          <div className="lg:col-span-2">
            <ExportPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

// Export avec lazy loading
export default dynamic(() => Promise.resolve(LazyExportPage), {
  loading: () => <PageLoading message="Chargement de l'export..." />,
  ssr: false
});
