'use client';

import React, { useState } from 'react';
import { LazyRecharts } from '@/components/OptimizedImports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Données simulées pour l'analyse des bundles
const bundleData = [
  { name: 'React', size: 0.3, color: '#61dafb' },
  { name: 'Next.js', size: 0.4, color: '#000000' },
  { name: 'Recharts', size: 0.2, color: '#ff6b6b' },
  { name: 'Heroicons', size: 0.1, color: '#4ecdc4' },
  { name: 'Tailwind', size: 0.15, color: '#06b6d4' },
  { name: 'Autres', size: 0.05, color: '#f39c12' }
];

const optimizationSteps = [
  {
    step: 1,
    name: 'Analyse initiale',
    description: 'Identification des modules les plus lourds',
    bundleSize: '2.5 MB',
    status: 'completed'
  },
  {
    step: 2,
    name: 'Lazy loading',
    description: 'Chargement différé des composants',
    bundleSize: '1.8 MB',
    status: 'completed'
  },
  {
    step: 3,
    name: 'Code splitting',
    description: 'Division du code par routes',
    bundleSize: '1.4 MB',
    status: 'completed'
  },
  {
    step: 4,
    name: 'Dynamic imports',
    description: 'Imports dynamiques pour les bibliothèques',
    bundleSize: '1.2 MB',
    status: 'completed'
  },
  {
    step: 5,
    name: 'Tree shaking',
    description: 'Élimination du code mort',
    bundleSize: '1.1 MB',
    status: 'in-progress'
  }
];

const moduleAnalysis = [
  { name: 'pages/analytics', size: 0.8, optimized: 0.3, reduction: '62%' },
  { name: 'pages/reports', size: 0.6, optimized: 0.2, reduction: '67%' },
  { name: 'pages/tasks', size: 0.4, optimized: 0.15, reduction: '62%' },
  { name: 'components/charts', size: 0.5, optimized: 0.1, reduction: '80%' },
  { name: 'components/icons', size: 0.3, optimized: 0.05, reduction: '83%' }
];

export default function BundleAnalysis() {
  const [selectedView, setSelectedView] = useState('overview');

  return (
    <div className="space-y-8">
      {/* Vue d'ensemble */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Analyse des Bundles</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              onClick={() => setSelectedView('overview')}
            >
              Vue d'ensemble
            </Button>
            <Button
              size="sm"
              variant={selectedView === 'modules' ? 'default' : 'outline'}
              onClick={() => setSelectedView('modules')}
            >
              Modules
            </Button>
            <Button
              size="sm"
              variant={selectedView === 'optimization' ? 'default' : 'outline'}
              onClick={() => setSelectedView('optimization')}
            >
              Optimisation
            </Button>
          </div>
        </div>

        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Graphique en camembert */}
            <div className="h-80">
              <LazyRecharts.ResponsiveContainer width="100%" height="100%">
                <LazyRecharts.PieChart>
                  <LazyRecharts.Pie
                    data={bundleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="size"
                  >
                    {bundleData.map((entry, index) => (
                      <LazyRecharts.Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </LazyRecharts.Pie>
                  <LazyRecharts.Tooltip />
                </LazyRecharts.PieChart>
              </LazyRecharts.ResponsiveContainer>
            </div>

            {/* Légende */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {bundleData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900 ml-auto">{item.size} MB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'modules' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Analyse par Module</h4>
            <div className="space-y-3">
              {moduleAnalysis.map((module, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{module.name}</span>
                      <Badge variant="outline" className="text-xs">
                        -{module.reduction}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Avant</span>
                          <span>{module.size} MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-400 h-2 rounded-full" 
                            style={{ width: `${(module.size / 1.0) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Après</span>
                          <span>{module.optimized} MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full" 
                            style={{ width: `${(module.optimized / 1.0) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'optimization' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Étapes d'Optimisation</h4>
            <div className="space-y-4">
              {optimizationSteps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'in-progress' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? '✓' : step.step}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-900">{step.name}</h5>
                      <Badge variant="outline" className="text-xs">
                        {step.bundleSize}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Commandes d'analyse */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Commandes d'Analyse</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <code className="text-sm font-mono text-gray-900">npm run analyze:report</code>
              <p className="text-xs text-gray-600 mt-1">Génère un rapport d'analyse des bundles</p>
            </div>
            <Button size="sm" variant="outline">
              Exécuter
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <code className="text-sm font-mono text-gray-900">npm run analyze</code>
              <p className="text-xs text-gray-600 mt-1">Ouvre l'analyseur visuel des bundles</p>
            </div>
            <Button size="sm" variant="outline">
              Exécuter
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <code className="text-sm font-mono text-gray-900">npm run analyze:full</code>
              <p className="text-xs text-gray-600 mt-1">Exécute l'analyse complète</p>
            </div>
            <Button size="sm" variant="outline">
              Exécuter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
