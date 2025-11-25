'use client';

import React from 'react';
import { KanbanMetrics as KanbanMetricsType } from '@/types/kanban';
import { formatCurrency, formatPercentage, formatDays } from '@/utils/cardUtils';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface KanbanMetricsProps {
  metrics: KanbanMetricsType;
}

export function KanbanMetrics({ metrics }: KanbanMetricsProps) {
  const metricCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads.toString(),
      icon: UserGroupIcon,
      color: 'text-brand-600',
      bgColor: 'bg-brand-100',
    },
    {
      title: 'Valeur Totale',
      value: formatCurrency(metrics.totalValue),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Valeur Potentielle',
      value: formatCurrency(metrics.potentialValue),
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Taux de Conversion',
      value: formatPercentage(metrics.overallConversionRate),
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Deal Moyen',
      value: formatCurrency(metrics.averageDealSize),
      icon: CurrencyDollarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Cycle de Vente',
      value: formatDays(metrics.averageSalesCycle || 0),
      icon: ClockIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Métriques du Pipeline
        </h2>
        <div className="text-sm text-gray-500">
          Mise à jour en temps réel
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {metricCards.map((metric, index) => (
          <div
            key={index}
            className={`${metric.bgColor} rounded-lg p-4 text-center`}
          >
            <metric.icon className={`h-6 w-6 ${metric.color} mx-auto mb-2`} />
            <div className={`text-2xl font-bold ${metric.color} mb-1`}>
              {metric.value}
            </div>
            <div className="text-xs text-gray-600 font-medium">
              {metric.title}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Leads by Stage */}
        {metrics.leadCountByStage && Object.keys(metrics.leadCountByStage).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Leads par Étape
          </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(metrics.leadCountByStage).map(([stageId, count]) => ({ name: `Étape ${stageId}`, leads: count }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart: Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Répartition des Statuts
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Ouverts', value: metrics.openLeads },
                  { name: 'Qualifiés', value: metrics.qualifiedLeads },
                  { name: 'Gagnés', value: metrics.wonLeads },
                  { name: 'Perdus', value: metrics.lostLeads }
                ]}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => {
                  // Only hide labels for very small segments (< 0.5%) to avoid clutter
                  if (percent < 0.005) return null;
                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#3B82F6" />
                <Cell fill="#10B981" />
                <Cell fill="#22C55E" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Value by Stage */}
        {metrics.valueByStage && Object.keys(metrics.valueByStage).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Valeur par Étape
          </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(metrics.valueByStage).map(([stageId, value]) => ({ name: `Étape ${stageId}`, value }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Conversion Rates */}
        {metrics.conversionRatesByStage && Object.keys(metrics.conversionRatesByStage).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Taux de Conversion par Étape
          </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(metrics.conversionRatesByStage).map(([stageId, rate]) => ({ name: `Étape ${stageId}`, rate }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="rate" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
