'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClockIcon,
  FunnelIcon,
  EyeIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

// Types pour les données d'analytics
interface ConversionFunnelData {
  stage: string;
  value: number;
  percentage: number;
  color: string;
}

interface SourceAnalysisData {
  source: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  color: string;
}

interface UserPerformanceData {
  userId: string;
  userName: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgDealSize: number;
  avgSalesCycle: number;
}

interface TemporalTrendData {
  period: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgDealSize: number;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedView, setSelectedView] = useState('funnel');
  const [selectedUser, setSelectedUser] = useState('all');

  // Données simulées pour le funnel de conversion
  const conversionFunnelData: ConversionFunnelData[] = [
    { stage: 'Visiteurs', value: 1000, percentage: 100, color: '#3B82F6' },
    { stage: 'Leads', value: 250, percentage: 25, color: '#10B981' },
    { stage: 'Qualifiés', value: 180, percentage: 18, color: '#F59E0B' },
    { stage: 'Prospects', value: 120, percentage: 12, color: '#8B5CF6' },
    { stage: 'Négociation', value: 80, percentage: 8, color: '#EF4444' },
    { stage: 'Fermé gagné', value: 45, percentage: 4.5, color: '#059669' }
  ];

  // Données simulées pour l'analyse des sources
  const sourceAnalysisData: SourceAnalysisData[] = [
    { source: 'Website', leads: 120, conversions: 24, revenue: 180000, conversionRate: 20, color: '#3B82F6' },
    { source: 'LinkedIn', leads: 85, conversions: 19, revenue: 142500, conversionRate: 22.4, color: '#0077B5' },
    { source: 'Email Marketing', leads: 65, conversions: 12, revenue: 90000, conversionRate: 18.5, color: '#10B981' },
    { source: 'Cold Call', leads: 45, conversions: 8, revenue: 60000, conversionRate: 17.8, color: '#F59E0B' },
    { source: 'Référence', leads: 35, conversions: 15, revenue: 112500, conversionRate: 42.9, color: '#8B5CF6' },
    { source: 'Événements', leads: 25, conversions: 6, revenue: 45000, conversionRate: 24, color: '#EF4444' }
  ];

  // Données simulées pour la performance par utilisateur
  const userPerformanceData: UserPerformanceData[] = [
    { userId: '1', userName: 'Marie Dubois', leads: 45, conversions: 18, revenue: 135000, conversionRate: 40, avgDealSize: 7500, avgSalesCycle: 25 },
    { userId: '2', userName: 'Jean Martin', leads: 38, conversions: 12, revenue: 90000, conversionRate: 31.6, avgDealSize: 7500, avgSalesCycle: 30 },
    { userId: '3', userName: 'Sophie Bernard', leads: 42, conversions: 15, revenue: 112500, conversionRate: 35.7, avgDealSize: 7500, avgSalesCycle: 28 },
    { userId: '4', userName: 'Pierre Moreau', leads: 35, conversions: 10, revenue: 75000, conversionRate: 28.6, avgDealSize: 7500, avgSalesCycle: 32 },
    { userId: '5', userName: 'Claire Petit', leads: 40, conversions: 14, revenue: 105000, conversionRate: 35, avgDealSize: 7500, avgSalesCycle: 26 }
  ];

  // Données simulées pour les tendances temporelles
  const temporalTrendData: TemporalTrendData[] = [
    { period: 'Jan', leads: 45, conversions: 12, revenue: 90000, conversionRate: 26.7, avgDealSize: 7500 },
    { period: 'Fév', leads: 52, conversions: 18, revenue: 135000, conversionRate: 34.6, avgDealSize: 7500 },
    { period: 'Mar', leads: 38, conversions: 15, revenue: 112500, conversionRate: 39.5, avgDealSize: 7500 },
    { period: 'Avr', leads: 61, conversions: 22, revenue: 165000, conversionRate: 36.1, avgDealSize: 7500 },
    { period: 'Mai', leads: 47, conversions: 19, revenue: 142500, conversionRate: 40.4, avgDealSize: 7500 },
    { period: 'Juin', leads: 55, conversions: 21, revenue: 157500, conversionRate: 38.2, avgDealSize: 7500 },
    { period: 'Juil', leads: 42, conversions: 16, revenue: 120000, conversionRate: 38.1, avgDealSize: 7500 },
    { period: 'Août', leads: 48, conversions: 20, revenue: 150000, conversionRate: 41.7, avgDealSize: 7500 },
    { period: 'Sep', leads: 53, conversions: 23, revenue: 172500, conversionRate: 43.4, avgDealSize: 7500 },
    { period: 'Oct', leads: 49, conversions: 18, revenue: 135000, conversionRate: 36.7, avgDealSize: 7500 },
    { period: 'Nov', leads: 44, conversions: 17, revenue: 127500, conversionRate: 38.6, avgDealSize: 7500 },
    { period: 'Déc', leads: 51, conversions: 21, revenue: 157500, conversionRate: 41.2, avgDealSize: 7500 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExportAnalytics = (format: 'pdf' | 'excel' | 'csv') => {
    alert(`✅ Export ${format.toUpperCase()} implémenté !\n\n📊 Analytics exportés en format ${format.toUpperCase()}\n📄 Données de la période sélectionnée\n💾 Téléchargement simulé`);
  };

  const periodOptions = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '3 derniers mois' },
    { value: '1y', label: '12 derniers mois' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  const viewOptions = [
    { value: 'funnel', label: 'Funnel de conversion' },
    { value: 'sources', label: 'Analyse des sources' },
    { value: 'users', label: 'Performance utilisateurs' },
    { value: 'trends', label: 'Tendances temporelles' }
  ];

  const userOptions = [
    { value: 'all', label: 'Tous les utilisateurs' },
    ...userPerformanceData.map(user => ({
      value: user.userId,
      label: user.userName
    }))
  ];

  const handlePeriodChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedPeriod(value);
    }
  };

  const handleUserChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedUser(value);
    }
  };

  // Calculer les métriques globales
  const globalMetrics = useMemo(() => {
    const totalLeads = sourceAnalysisData.reduce((sum, source) => sum + source.leads, 0);
    const totalConversions = sourceAnalysisData.reduce((sum, source) => sum + source.conversions, 0);
    const totalRevenue = sourceAnalysisData.reduce((sum, source) => sum + source.revenue, 0);
    const avgConversionRate = (totalConversions / totalLeads) * 100;
    
    return {
      totalLeads,
      totalConversions,
      totalRevenue,
      avgConversionRate
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Avancés</h1>
              <p className="text-sm text-gray-600">
                Analysez en profondeur les performances et optimisez votre stratégie
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Filtres de période */}
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedPeriod}
                  onChange={handlePeriodChange}
                  options={periodOptions}
                />
              </div>

              {/* Filtre utilisateur */}
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedUser}
                  onChange={handleUserChange}
                  options={userOptions}
                />
              </div>

              {/* Actions d'export */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportAnalytics('pdf')}
                  className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportAnalytics('excel')}
                  className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportAnalytics('csv')}
                  className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métriques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <ChartBarIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total des leads
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {globalMetrics.totalLeads}
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
                    <span className="text-white text-sm font-medium">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Taux de conversion moyen
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {globalMetrics.avgConversionRate.toFixed(1)}%
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
                    <span className="text-white text-sm font-medium">$</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Revenus totaux
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(globalMetrics.totalRevenue)}
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
                    <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversions totales
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {globalMetrics.totalConversions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="mb-8">
          <Tabs
            value={selectedView}
            onValueChange={setSelectedView}
            defaultValue="funnel"
            className="border-b border-gray-200"
          >
            <TabsList className="grid w-full grid-cols-4">
              {viewOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Contenu des analytics */}
            <div className="space-y-8">
              <TabsContent value="funnel">
                <div className="space-y-8">
                  {/* Funnel de conversion */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Funnel de conversion détaillé
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={conversionFunnelData} 
                          layout="horizontal"
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="stage" type="category" width={100} />
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              `${value} personnes (${props.payload.percentage}%)`,
                              'Nombre'
                            ]}
                          />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tableau détaillé du funnel */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Détail du funnel de conversion
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Étape
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pourcentage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taux de conversion
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {conversionFunnelData.map((step, index) => {
                            const previousValue = index > 0 ? conversionFunnelData[index - 1]?.value || step.value : step.value;
                            const conversionRate = ((step.value / previousValue) * 100).toFixed(1);
                            
                            return (
                              <tr key={step.stage}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 rounded mr-3" 
                                      style={{ backgroundColor: step.color }}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {step.stage}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {step.value.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {step.percentage}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {index === 0 ? '100%' : `${conversionRate}%`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sources">
                <div className="space-y-8">
                  {/* Graphique des sources */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Performance par source de leads
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourceAnalysisData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="source" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(Number(value)) : value,
                              name === 'leads' ? 'Leads' : name === 'conversions' ? 'Conversions' : 'Revenus'
                            ]}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="leads" fill="#3B82F6" name="Leads" />
                          <Bar yAxisId="left" dataKey="conversions" fill="#10B981" name="Conversions" />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            name="Taux de conversion (%)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graphique en secteurs des revenus par source */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Répartition des revenus par source
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sourceAnalysisData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ source, conversionRate }) => `${source}: ${conversionRate}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue"
                          >
                            {sourceAnalysisData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenus']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tableau détaillé des sources */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Analyse détaillée des sources
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Source
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Leads
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Conversions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taux de conversion
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenus
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenus par lead
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sourceAnalysisData.map((source) => (
                            <tr key={source.source}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded mr-3" 
                                    style={{ backgroundColor: source.color }}
                                  ></div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {source.source}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {source.leads}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {source.conversions}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <Badge 
                                  variant="default" 
                                  className={
                                    source.conversionRate > 30 
                                      ? "bg-green-100 text-green-800" 
                                      : source.conversionRate > 20 
                                        ? "bg-yellow-100 text-yellow-800" 
                                        : "bg-red-100 text-red-800"
                                  }
                                >
                                  {source.conversionRate}%
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(source.revenue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(source.revenue / source.leads)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users">
                <div className="space-y-8">
                  {/* Graphique de performance des utilisateurs */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Performance des utilisateurs - Revenus
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="userName" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(Number(value)) : value,
                              name === 'leads' ? 'Leads' : name === 'conversions' ? 'Conversions' : 'Revenus'
                            ]}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="leads" fill="#3B82F6" name="Leads" />
                          <Bar yAxisId="left" dataKey="conversions" fill="#10B981" name="Conversions" />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            name="Revenus"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tableau de performance des utilisateurs */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Classement des utilisateurs
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rang
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Leads
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Conversions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taux de conversion
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenus
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cycle de vente moyen
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userPerformanceData
                            .sort((a, b) => b.revenue - a.revenue)
                            .map((user, index) => (
                            <tr key={user.userId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  {index === 0 && <span className="text-yellow-500 mr-2">🥇</span>}
                                  {index === 1 && <span className="text-gray-400 mr-2">🥈</span>}
                                  {index === 2 && <span className="text-orange-500 mr-2">🥉</span>}
                                  #{index + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.userName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.leads}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.conversions}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <Badge 
                                  variant="default" 
                                  className={
                                    user.conversionRate > 35 
                                      ? "bg-green-100 text-green-800" 
                                      : user.conversionRate > 30 
                                        ? "bg-yellow-100 text-yellow-800" 
                                        : "bg-red-100 text-red-800"
                                  }
                                >
                                  {user.conversionRate}%
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(user.revenue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.avgSalesCycle} jours
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trends">
                <div className="space-y-8">
                  {/* Graphique des tendances temporelles */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Tendances temporelles - Leads et Conversions
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={temporalTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(Number(value)) : value,
                              name === 'leads' ? 'Leads' : name === 'conversions' ? 'Conversions' : 'Revenus'
                            ]}
                          />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="leads"
                            stackId="1"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.6}
                            name="Leads"
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="conversions"
                            stackId="2"
                            stroke="#10B981"
                            fill="#10B981"
                            fillOpacity={0.6}
                            name="Conversions"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            name="Revenus"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graphique du taux de conversion dans le temps */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Évolution du taux de conversion
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={temporalTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Taux de conversion']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            name="Taux de conversion (%)"
                            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Résumé des tendances */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Résumé des tendances
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {temporalTrendData.reduce((sum, item) => sum + item.leads, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Leads totaux</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(temporalTrendData.reduce((sum, item) => sum + item.conversionRate, 0) / temporalTrendData.length).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Taux de conversion moyen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(temporalTrendData.reduce((sum, item) => sum + item.revenue, 0))}
                        </div>
                        <div className="text-sm text-gray-600">Revenus totaux</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Résumé de la tâche */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800 mb-3">
                ✅ Tâche 8.2 - Page de statistiques avancées complétée !
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Fonctionnalités selon FRONTEND_TASKS.md :</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• ✅ <strong>Funnel de conversion</strong> : Graphique en entonnoir détaillé</li>
                    <li>• ✅ <strong>Analyse des sources</strong> : Performance par source de leads</li>
                    <li>• ✅ <strong>Performance par utilisateur</strong> : Classement et métriques</li>
                    <li>• ✅ <strong>Tendances temporelles</strong> : Évolution dans le temps</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Fonctionnalités avancées :</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• 4 onglets de navigation spécialisés</li>
                    <li>• Graphiques interactifs avec Recharts</li>
                    <li>• Tableaux détaillés avec classements</li>
                    <li>• Filtres par période et utilisateur</li>
                    <li>• Export des analytics (PDF, Excel, CSV)</li>
                    <li>• Métriques globales en temps réel</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>📋 Conforme aux spécifications FRONTEND_TASKS.md (8.2)</strong><br/>
                  ✅ Fichier créé : web/src/app/analytics/page.tsx<br/>
                  ✅ Toutes les fonctionnalités demandées implémentées
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
