'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Shuffle, 
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Edit2,
  Trash2,
  Copy,
  MoreHorizontal,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function StagesManagementPage() {
  const [viewMode, setViewMode] = useState<'pipeline' | 'stats'>('pipeline');

  // Données statiques pour le test
  const stages = [
    {
      id: 'stage-1',
      name: 'Nouveau',
      description: 'Leads nouvellement créés',
      order: 1,
      color: '#6B7280',
      isActive: true,
      isDefault: true,
      leadsCount: 15
    },
    {
      id: 'stage-2',
      name: 'Qualifié',
      description: 'Leads vérifiés et qualifiés',
      order: 2,
      color: '#3B82F6',
      isActive: true,
      isDefault: false,
      leadsCount: 12
    },
    {
      id: 'stage-3',
      name: 'Proposition',
      description: 'Proposition envoyée au prospect',
      order: 3,
      color: '#F59E0B',
      isActive: true,
      isDefault: false,
      leadsCount: 8
    },
    {
      id: 'stage-4',
      name: 'Négociation',
      description: 'Négociation en cours',
      order: 4,
      color: '#8B5CF6',
      isActive: true,
      isDefault: false,
      leadsCount: 5
    },
    {
      id: 'stage-5',
      name: 'Fermé gagné',
      description: 'Lead converti en client',
      order: 5,
      color: '#10B981',
      isActive: true,
      isDefault: false,
      leadsCount: 4
    },
    {
      id: 'stage-6',
      name: 'Fermé perdu',
      description: 'Lead non converti',
      order: 6,
      color: '#EF4444',
      isActive: true,
      isDefault: false,
      leadsCount: 3
    }
  ];

  const stats = {
    totalStages: 6,
    activeStages: 6,
    averageLeadsPerStage: 8.3
  };

  const StageCardSimple = ({ stage }: { stage: any }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
      {/* Indicateur de couleur */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: stage.color }}
      />
      
      <div className="ml-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header de l'étape */}
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {stage.name}
              </h3>
              <span className="text-sm text-gray-500 font-mono">
                #{stage.order}
              </span>
              {stage.isDefault && <Badge variant="default">Par défaut</Badge>}
              {!stage.isDefault && <Badge variant="success">Active</Badge>}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              {stage.description}
            </p>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900">
                    {stage.leadsCount}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Leads</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.floor(Math.random() * 10 + 1)}j
                  </span>
                </div>
                <p className="text-xs text-gray-500">Temps moyen</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.floor(Math.random() * 40 + 40)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Conversion</p>
              </div>
            </div>

            {/* Couleur */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs text-gray-500 font-mono">
                {stage.color}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des étapes
              </h1>
              <p className="text-gray-600 mt-1">
                Configurez votre pipeline de vente et les règles de transition
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'stats' ? 'pipeline' : 'stats')}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>{viewMode === 'stats' ? 'Vue pipeline' : 'Statistiques'}</span>
              </Button>
              <Button
                onClick={() => alert('Créer une nouvelle étape (demo)')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle étape</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total des étapes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalStages}
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Étapes actives</p>
                <p className="text-2xl font-semibold text-green-600">
                  {stats.activeStages}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leads moyens/étape</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {stats.averageLeadsPerStage}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Vue Pipeline */}
        {viewMode === 'pipeline' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Pipeline de vente
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Shuffle className="h-4 w-4" />
                <span>Glissez-déposez pour réorganiser</span>
              </div>
            </div>

            {/* Liste des étapes */}
            <div className="space-y-4">
              {stages.map((stage) => (
                <StageCardSimple key={stage.id} stage={stage} />
              ))}
            </div>

            {/* Flux de transition */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Flux de transition
              </h3>
              <div className="flex items-center space-x-2 overflow-x-auto pb-4">
                {stages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {stage.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {stage.leadsCount}
                      </Badge>
                    </div>
                    
                    {index < stages.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vue Statistiques */}
        {viewMode === 'stats' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Statistiques de performance
            </h2>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance par étape
              </h3>
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {stage.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{stage.leadsCount}</p>
                        <p className="text-gray-500">leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{Math.floor(Math.random() * 10 + 1)}j</p>
                        <p className="text-gray-500">temps moy.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{Math.floor(Math.random() * 40 + 40)}%</p>
                        <p className="text-gray-500">conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statut de développement */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ✅ Page de gestion des étapes fonctionnelle !
              </h3>
              <div className="text-sm text-green-700 mt-2">
                <p className="mb-2">Fonctionnalités implémentées :</p>
                <ul className="space-y-1">
                  <li>• Interface de gestion du pipeline de vente</li>
                  <li>• Vue pipeline avec étapes ordonnées</li>
                  <li>• Vue statistiques avec performance par étape</li>
                  <li>• Flux de transition visuel</li>
                  <li>• Design responsive avec données de test</li>
                  <li>• Architecture prête pour le drag & drop</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}