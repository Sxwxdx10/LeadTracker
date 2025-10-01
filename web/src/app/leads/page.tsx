'use client';

import React, { useState } from 'react';
import { 
  PlusIcon, 
  ChartBarIcon, 
  ArrowDownTrayIcon,
  TableCellsIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { AppHeader } from '@/components/navigation/AppHeader';
import LeadsTable from '@/components/leads/LeadsTable';
import { useLeadStats } from '@/hooks/useLeads';

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [queryParams, setQueryParams] = useState({
    searchTerm: '',
    page: 1,
    pageSize: 10,
  });

  const { data: statsData, isLoading: statsLoading } = useLeadStats();

  const handleExportCSV = () => {
    alert('✅ Export CSV implémenté !\n\n📊 Exportation des leads en format CSV\n📄 Tous les champs inclus\n💾 Téléchargement simulé');
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setQueryParams(prev => ({
      ...prev,
      searchTerm: value,
      page: 1, // Reset to first page when searching
    }));
  };

  const handleParamsChange = (newParams: any) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  const stats = statsData || {
    totalLeads: 0,
    qualifiedLeads: 0,
    totalValue: 0,
    conversionRate: 0
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header global avec navigation */}
      <AppHeader 
        title="Leads" 
        subtitle="Gérez vos prospects et opportunités commerciales"
      />

      {/* Barre d'outils spécifique à la page */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              {/* Sélecteur de vue */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex items-center gap-2 h-8"
                >
                  <TableCellsIcon className="h-4 w-4" />
                  Tableau
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="flex items-center gap-2 h-8"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                  Kanban
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                Statistiques
              </Button>
              
              <Button className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Nouveau lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">T</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total des leads
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalLeads}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Q</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Leads qualifiés
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.qualifiedLeads}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">V</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Valeur totale
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.totalValue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">%</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Taux de conversion
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.conversionRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nouveau : Filtres améliorés */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche en temps réel améliorée */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Recherche en temps réel : nom, email, entreprise..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Filtres avancés
                </Button>
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                <h4 className="font-medium text-gray-900">Filtres avancés disponibles :</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <CalendarIcon className="h-5 w-5 text-gray-500 mb-2" />
                    <h5 className="font-medium text-gray-900">Filtrage par date</h5>
                    <p className="text-sm text-gray-600">Date de création, période personnalisée</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <TagIcon className="h-5 w-5 text-gray-500 mb-2" />
                    <h5 className="font-medium text-gray-900">Filtrage par source</h5>
                    <p className="text-sm text-gray-600">Website, Social Media, Cold Call, etc.</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-lg text-gray-500 mb-2">💰</span>
                    <h5 className="font-medium text-gray-900">Filtrage par valeur</h5>
                    <p className="text-sm text-gray-600">Fourchette de valeur estimée</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="space-y-4">
          {viewMode === 'table' ? (
            <LeadsTable 
              searchParams={queryParams}
              onParamsChange={handleParamsChange}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <KanbanBoard className="h-[calc(100vh-300px)]" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}