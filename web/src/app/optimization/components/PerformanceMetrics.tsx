'use client';

import React, { useState, useEffect } from 'react';
import { LazyRecharts } from '@/components/OptimizedImports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Données simulées pour les métriques de performance
const performanceMetrics = [
  { name: 'First Contentful Paint', value: '1.2s', target: '1.8s', status: 'good' },
  { name: 'Largest Contentful Paint', value: '2.1s', target: '2.5s', status: 'good' },
  { name: 'First Input Delay', value: '45ms', target: '100ms', status: 'good' },
  { name: 'Cumulative Layout Shift', value: '0.05', target: '0.1', status: 'good' },
  { name: 'Time to Interactive', value: '2.8s', target: '3.8s', status: 'good' }
];

const bundleMetrics = [
  { name: 'Jan', size: 2.5, loadTime: 3.2 },
  { name: 'Fév', size: 2.2, loadTime: 2.8 },
  { name: 'Mar', size: 1.9, loadTime: 2.4 },
  { name: 'Avr', size: 1.6, loadTime: 2.1 },
  { name: 'Mai', size: 1.3, loadTime: 1.9 },
  { name: 'Juin', size: 1.1, loadTime: 1.7 }
];

const optimizationImpact = [
  { name: 'Bundle Size', before: 2.5, after: 1.1, improvement: '56%' },
  { name: 'Load Time', before: 3.2, after: 1.7, improvement: '47%' },
  { name: 'Memory Usage', before: 45, after: 28, improvement: '38%' },
  { name: 'First Paint', before: 2.1, after: 1.2, improvement: '43%' }
];

export default function PerformanceMetrics() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    // Simuler le chargement des métriques
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métriques Core Web Vitals */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    metric.status === 'good' ? 'text-green-600 border-green-200' :
                    metric.status === 'needs-improvement' ? 'text-yellow-600 border-yellow-200' :
                    'text-red-600 border-red-200'
                  }`}
                >
                  {metric.status === 'good' ? 'Bon' : 
                   metric.status === 'needs-improvement' ? 'À améliorer' : 'Mauvais'}
                </Badge>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                <span className="text-sm text-gray-500 ml-2">/ {metric.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Évolution des performances */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Évolution des Performances</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedMetric === 'overview' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('overview')}
            >
              Vue d'ensemble
            </Button>
            <Button
              size="sm"
              variant={selectedMetric === 'bundle' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('bundle')}
            >
              Bundle
            </Button>
            <Button
              size="sm"
              variant={selectedMetric === 'impact' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('impact')}
            >
              Impact
            </Button>
          </div>
        </div>

        {selectedMetric === 'overview' && (
          <div className="h-80">
            <LazyRecharts.ResponsiveContainer width="100%" height="100%">
              <LazyRecharts.LineChart data={bundleMetrics}>
                <LazyRecharts.CartesianGrid strokeDasharray="3 3" />
                <LazyRecharts.XAxis dataKey="name" />
                <LazyRecharts.YAxis />
                <LazyRecharts.Tooltip />
                <LazyRecharts.Legend />
                <LazyRecharts.Line 
                  type="monotone" 
                  dataKey="size" 
                  stroke="#8884d8" 
                  strokeWidth={2} 
                  name="Taille Bundle (MB)" 
                />
                <LazyRecharts.Line 
                  type="monotone" 
                  dataKey="loadTime" 
                  stroke="#82ca9d" 
                  strokeWidth={2} 
                  name="Temps Chargement (s)" 
                />
              </LazyRecharts.LineChart>
            </LazyRecharts.ResponsiveContainer>
          </div>
        )}

        {selectedMetric === 'bundle' && (
          <div className="h-80">
            <LazyRecharts.ResponsiveContainer width="100%" height="100%">
              <LazyRecharts.AreaChart data={bundleMetrics}>
                <LazyRecharts.CartesianGrid strokeDasharray="3 3" />
                <LazyRecharts.XAxis dataKey="name" />
                <LazyRecharts.YAxis />
                <LazyRecharts.Tooltip />
                <LazyRecharts.Area 
                  type="monotone" 
                  dataKey="size" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Taille Bundle (MB)" 
                />
              </LazyRecharts.AreaChart>
            </LazyRecharts.ResponsiveContainer>
          </div>
        )}

        {selectedMetric === 'impact' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Impact des Optimisations</h4>
            <div className="space-y-3">
              {optimizationImpact.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <Badge variant="outline" className="text-xs text-green-600">
                        +{item.improvement}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Avant</span>
                          <span>{item.before}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-400 h-2 rounded-full" 
                            style={{ width: `${(item.before / 3.0) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Après</span>
                          <span>{item.after}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full" 
                            style={{ width: `${(item.after / 3.0) * 100}%` }}
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
      </div>

      {/* Recommandations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Recommandations d'Optimisation</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>Continuer à utiliser le lazy loading pour les nouvelles pages</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>Implémenter React.memo pour les composants coûteux</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>Utiliser useMemo et useCallback pour les calculs lourds</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>Optimiser les images avec next/image</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">5.</span>
            <span>Surveiller régulièrement les métriques avec le bundle analyzer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
