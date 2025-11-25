'use client';

import React, { useState } from 'react';
import { useCache, useCacheStats, useCachedQuery, useCachedMutation } from '@/hooks/useCache';
import { useCacheContext } from '@/contexts/CacheContext';
import { useLeadsApi, useAnalyticsApi, useTasksApi, cacheInvalidation } from '@/lib/cacheApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  ChartBarIcon, 
  ListBulletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

// Données simulées pour la démonstration
const mockLeads = [
  { id: '1', name: 'Jean Dupont', email: 'jean@example.com', status: 'active' },
  { id: '2', name: 'Marie Martin', email: 'marie@example.com', status: 'qualified' },
  { id: '3', name: 'Pierre Durand', email: 'pierre@example.com', status: 'converted' },
];

const mockAnalytics = {
  totalLeads: 150,
  conversionRate: 24.5,
  revenue: 45000,
  growth: 12.3,
};

const mockTasks = [
  { id: '1', title: 'Appeler prospect ABC', status: 'pending', priority: 'high' },
  { id: '2', title: 'Préparer présentation', status: 'in_progress', priority: 'medium' },
  { id: '3', title: 'Envoyer devis', status: 'completed', priority: 'low' },
];

export default function CacheDemoPage() {
  const [selectedDemo, setSelectedDemo] = useState('stats');
  const { stats, clearCache, invalidateByTag, isOnline, syncStatus } = useCacheContext();
  const cacheStats = useCacheStats();

  // Démonstration des hooks de cache
  const { data: leadsData, loading: leadsLoading, refresh: refreshLeads } = useCachedQuery(
    'demo:leads',
    () => new Promise(resolve => setTimeout(() => resolve(mockLeads), 1000)),
    { ttl: 30000, tags: ['demo', 'leads'] }
  );

  const { data: analyticsData, loading: analyticsLoading, refresh: refreshAnalytics } = useCachedQuery(
    'demo:analytics',
    () => new Promise(resolve => setTimeout(() => resolve(mockAnalytics), 800)),
    { ttl: 60000, tags: ['demo', 'analytics'] }
  );

  const { data: tasksData, loading: tasksLoading, refresh: refreshTasks } = useCachedQuery(
    'demo:tasks',
    () => new Promise(resolve => setTimeout(() => resolve(mockTasks), 500)),
    { ttl: 20000, tags: ['demo', 'tasks'] }
  );

  // Démonstration des mutations avec cache
  const { mutate: createLead, loading: creatingLead } = useCachedMutation(
    async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Date.now().toString(), ...data };
    },
    {
      invalidateTags: ['demo', 'leads'],
    }
  );

  const handleCreateLead = () => {
    createLead({
      name: 'Nouveau Lead',
      email: 'nouveau@example.com',
      status: 'active',
    });
  };

  const demos = [
    { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
    { id: 'data', label: 'Données', icon: CircleStackIcon },
    { id: 'invalidation', label: 'Invalidation', icon: TrashIcon },
    { id: 'sync', label: 'Synchronisation', icon: ArrowPathIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Démonstration du Cache</h1>
              <p className="text-sm text-gray-600">Gestion intelligente du cache des données</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {syncStatus === 'syncing' ? 'Synchronisation...' : 'Synchronisé'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onglets de démonstration */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setSelectedDemo(demo.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                  selectedDemo === demo.id
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <demo.icon className="h-4 w-4" />
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des démonstrations */}
        {selectedDemo === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-semibold text-sm">{stats.hits}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Cache Hits</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.hits}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold text-sm">{stats.misses}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Cache Misses</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.misses}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {(stats.hitRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Hit Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(stats.hitRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold text-sm">{stats.size}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Taille Cache</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.size}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions du Cache</h3>
              <div className="flex gap-4">
                <Button onClick={clearCache} variant="outline" className="flex items-center gap-2">
                  <TrashIcon className="h-4 w-4" />
                  Vider le Cache
                </Button>
                <Button onClick={() => invalidateByTag('demo')} variant="outline" className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Invalider Demo
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'data' && (
          <div className="space-y-6">
            {/* Leads */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Leads (TTL: 30s)</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={refreshLeads} 
                    size="sm" 
                    variant="outline"
                    disabled={leadsLoading}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${leadsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {leadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <ClockIcon className="h-6 w-6 animate-spin text-brand-600 mr-2" />
                  <span className="text-gray-600">Chargement...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(leadsData) && leadsData.map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{lead.name}</span>
                        <span className="text-gray-500 ml-2">({lead.email})</span>
                      </div>
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics (TTL: 60s)</h3>
                <Button 
                  onClick={refreshAnalytics} 
                  size="sm" 
                  variant="outline"
                  disabled={analyticsLoading}
                >
                  <ArrowPathIcon className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <ClockIcon className="h-6 w-6 animate-spin text-brand-600 mr-2" />
                  <span className="text-gray-600">Chargement...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{(analyticsData as any)?.totalLeads || 0}</p>
                    <p className="text-sm text-gray-500">Total Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{(analyticsData as any)?.conversionRate || 0}%</p>
                    <p className="text-sm text-gray-500">Taux Conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">${(analyticsData as any)?.revenue || 0}</p>
                    <p className="text-sm text-gray-500">Revenus</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{(analyticsData as any)?.growth || 0}%</p>
                    <p className="text-sm text-gray-500">Croissance</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tâches (TTL: 20s)</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={refreshTasks} 
                    size="sm" 
                    variant="outline"
                    disabled={tasksLoading}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button 
                    onClick={handleCreateLead} 
                    size="sm"
                    disabled={creatingLead}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <ClockIcon className="h-6 w-6 animate-spin text-brand-600 mr-2" />
                  <span className="text-gray-600">Chargement...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(tasksData) && tasksData.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{task.title}</span>
                        <span className="text-gray-500 ml-2">({task.priority})</span>
                      </div>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedDemo === 'invalidation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invalidation du Cache</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => cacheInvalidation.invalidateLeads()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Invalider Leads
                </Button>
                <Button 
                  onClick={() => cacheInvalidation.invalidateAnalytics()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Invalider Analytics
                </Button>
                <Button 
                  onClick={() => cacheInvalidation.invalidateReports()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Invalider Reports
                </Button>
                <Button 
                  onClick={() => cacheInvalidation.invalidateTasks()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Invalider Tasks
                </Button>
                <Button 
                  onClick={() => cacheInvalidation.invalidateAuth()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Invalider Auth
                </Button>
                <Button 
                  onClick={() => cacheInvalidation.invalidateAll()} 
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Tout Invalider
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'sync' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Synchronisation</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">Statut de connexion</span>
                  </div>
                  <Badge variant="outline">{isOnline ? 'En ligne' : 'Hors ligne'}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowPathIcon className={`h-5 w-5 ${syncStatus === 'syncing' ? 'animate-spin text-brand-600' : 'text-gray-400'}`} />
                    <span className="font-medium">Synchronisation</span>
                  </div>
                  <Badge variant="outline">
                    {syncStatus === 'syncing' ? 'En cours...' : 'Terminée'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message de succès */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-800">
                ✅ Tâche 10.2 - Gestion du cache terminée avec succès !
              </h3>
              <p className="text-green-700 mt-1">
                Toutes les fonctionnalités de gestion du cache ont été implémentées :
              </p>
              <ul className="text-green-700 mt-2 ml-4 list-disc space-y-1">
                <li>Hook useCache avec cache des requêtes API</li>
                <li>Invalidation intelligente par tags et dépendances</li>
                <li>Synchronisation des données en temps réel</li>
                <li>Provider de cache global avec contexte</li>
                <li>API client avec cache automatique</li>
                <li>Statistiques et monitoring du cache</li>
                <li>Gestion de la connectivité et synchronisation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

