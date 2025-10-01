'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PageLoading } from '@/components/LazyPage';

// Lazy load des composants lourds
const ImportWizard = dynamic(
  () => import('./components/ImportWizard'),
  { 
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

const ImportReport = dynamic(
  () => import('./components/ImportReport'),
  { 
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

// Composant principal lazy-loaded
const LazyImportPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Import de Données</h1>
              <p className="text-sm text-gray-600">Importez vos données depuis un fichier CSV</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assistant d'import lazy-loaded */}
        <ImportWizard />
        
        {/* Rapport d'import lazy-loaded */}
        <div className="mt-8">
          <ImportReport />
        </div>
      </div>
    </div>
  );
};

// Export avec lazy loading
export default dynamic(() => Promise.resolve(LazyImportPage), {
  loading: () => <PageLoading message="Chargement de l'import..." />,
  ssr: false
});
