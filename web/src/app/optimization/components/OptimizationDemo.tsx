'use client';

import React, { useState } from 'react';
import { LazyRecharts, LazyIcons } from '@/components/OptimizedImports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Données simulées
const performanceData = [
  { name: 'Avant', bundle: 2.5, loadTime: 3.2, memory: 45 },
  { name: 'Après', bundle: 1.2, loadTime: 1.8, memory: 28 }
];

const optimizationFeatures = [
  {
    name: 'Lazy Loading',
    description: 'Chargement différé des composants lourds',
    impact: 'Réduction de 40% du bundle initial',
    status: '✅ Implémenté'
  },
  {
    name: 'Code Splitting',
    description: 'Division du code par routes',
    impact: 'Chargement plus rapide des pages',
    status: '✅ Implémenté'
  },
  {
    name: 'Dynamic Imports',
    description: 'Imports dynamiques pour les bibliothèques',
    impact: 'Réduction de 60% de la taille du bundle principal',
    status: '✅ Implémenté'
  },
  {
    name: 'Bundle Analyzer',
    description: 'Analyse visuelle des bundles',
    impact: 'Visibilité sur la taille des modules',
    status: '✅ Configuré'
  },
  {
    name: 'Tree Shaking',
    description: 'Élimination du code mort',
    impact: 'Réduction automatique de la taille',
    status: '✅ Activé'
  }
];

export default function OptimizationDemo() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="space-y-8">
      {/* Métriques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">1.2</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Taille du Bundle</p>
              <p className="text-2xl font-semibold text-gray-900">1.2 MB</p>
              <p className="text-sm text-green-600">-52% vs avant</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">1.8s</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Temps de Chargement</p>
              <p className="text-2xl font-semibold text-gray-900">1.8s</p>
              <p className="text-sm text-green-600">-44% vs avant</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold text-sm">28MB</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Mémoire Utilisée</p>
              <p className="text-2xl font-semibold text-gray-900">28 MB</p>
              <p className="text-sm text-green-600">-38% vs avant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique de comparaison */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Comparaison des Performances</h3>
          <Button
            onClick={() => setShowChart(!showChart)}
            variant="outline"
            size="sm"
          >
            {showChart ? 'Masquer' : 'Afficher'} le graphique
          </Button>
        </div>
        
        {showChart && (
          <div className="h-80">
            <LazyRecharts.ResponsiveContainer width="100%" height="100%">
              <LazyRecharts.BarChart data={performanceData}>
                <LazyRecharts.CartesianGrid strokeDasharray="3 3" />
                <LazyRecharts.XAxis dataKey="name" />
                <LazyRecharts.YAxis />
                <LazyRecharts.Tooltip />
                <LazyRecharts.Legend />
                <LazyRecharts.Bar dataKey="bundle" fill="#8884d8" name="Bundle (MB)" />
                <LazyRecharts.Bar dataKey="loadTime" fill="#82ca9d" name="Temps (s)" />
                <LazyRecharts.Bar dataKey="memory" fill="#ffc658" name="Mémoire (MB)" />
              </LazyRecharts.BarChart>
            </LazyRecharts.ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Fonctionnalités d'optimisation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fonctionnalités d'Optimisation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optimizationFeatures.map((feature, index) => (
            <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">✓</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{feature.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {feature.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                <p className="text-xs text-green-600 mt-1">{feature.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions d'utilisation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Comment utiliser les optimisations</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>Les pages lourdes (Analytics, Reports, Tasks) sont automatiquement lazy-loadées</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>Les graphiques Recharts se chargent uniquement quand nécessaire</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>Utilisez <code className="bg-blue-100 px-1 rounded">npm run analyze</code> pour analyser les bundles</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>Les composants utilisent l'Intersection Observer pour le lazy loading</span>
          </div>
        </div>
      </div>
    </div>
  );
}
