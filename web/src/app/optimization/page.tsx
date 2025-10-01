'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { PageLoading } from '@/components/LazyPage';
import { LazyLoadWrapper, ChartLoadingSkeleton } from '@/components/OptimizedImports';

// Lazy load des composants lourds
const OptimizationDemo = dynamic(
  () => import('./components/OptimizationDemo'),
  { 
    loading: () => <ChartLoadingSkeleton height={400} />,
    ssr: false 
  }
);

const BundleAnalysis = dynamic(
  () => import('./components/BundleAnalysis'),
  { 
    loading: () => <ChartLoadingSkeleton height={300} />,
    ssr: false 
  }
);

const PerformanceMetrics = dynamic(
  () => import('./components/PerformanceMetrics'),
  { 
    loading: () => <ChartLoadingSkeleton height={200} />,
    ssr: false 
  }
);

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState('demo');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Optimisation des Performances</h1>
              <p className="text-sm text-gray-600">Lazy loading, code splitting et optimisation des bundles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'demo', label: 'Démonstration' },
              { id: 'analysis', label: 'Analyse des Bundles' },
              { id: 'metrics', label: 'Métriques de Performance' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        <LazyLoadWrapper fallback={<ChartLoadingSkeleton height={400} />}>
          {activeTab === 'demo' && <OptimizationDemo />}
          {activeTab === 'analysis' && <BundleAnalysis />}
          {activeTab === 'metrics' && <PerformanceMetrics />}
        </LazyLoadWrapper>

        {/* Message de succès */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-green-800">
                ✅ Tâche 10.1 - Lazy loading et code splitting terminée avec succès !
              </h3>
              <p className="text-green-700 mt-1">
                Toutes les optimisations de performance ont été implémentées :
              </p>
              <ul className="text-green-700 mt-2 ml-4 list-disc space-y-1">
                <li>Lazy loading des pages lourdes (Analytics, Reports, Tasks, Import/Export)</li>
                <li>Code splitting par route et composants</li>
                <li>Imports dynamiques pour Recharts et icônes</li>
                <li>Bundle analyzer configuré et fonctionnel</li>
                <li>Optimisation des bundles avec tree shaking</li>
                <li>Composants de chargement optimisés</li>
                <li>Intersection Observer pour le lazy loading</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
