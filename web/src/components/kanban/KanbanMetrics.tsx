'use client';

import React from 'react';
import { KanbanMetrics as KanbanMetricsType } from '@/types/kanban';
import { formatCurrency, formatPercentage, formatDays } from '@/hooks/useKanban';
import { 
  ChartBarIcon,
  CurrencyEuroIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface KanbanMetricsProps {
  metrics: KanbanMetricsType;
}

export function KanbanMetrics({ metrics }: KanbanMetricsProps) {
  const metricCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads.toString(),
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Valeur Totale',
      value: formatCurrency(metrics.totalValue),
      icon: CurrencyEuroIcon,
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
      icon: CurrencyEuroIcon,
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

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by Stage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Leads par Étape
          </h3>
          <div className="space-y-2">
            {metrics.leadCountByStage ? Object.entries(metrics.leadCountByStage).map(([stageId, count]) => (
              <div key={stageId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Étape {stageId}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            )) : (
              <div className="text-sm text-gray-500">Aucune donnée disponible</div>
            )}
          </div>
        </div>

        {/* Value by Stage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Valeur par Étape
          </h3>
          <div className="space-y-2">
            {metrics.valueByStage ? Object.entries(metrics.valueByStage).map(([stageId, value]) => (
              <div key={stageId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Étape {stageId}</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(value)}
                </span>
              </div>
            )) : (
              <div className="text-sm text-gray-500">Aucune donnée disponible</div>
            )}
          </div>
        </div>

        {/* Conversion Rates by Stage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Taux de Conversion par Étape
          </h3>
          <div className="space-y-2">
            {metrics.conversionRatesByStage ? Object.entries(metrics.conversionRatesByStage).map(([stageId, rate]) => (
              <div key={stageId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Étape {stageId}</span>
                <span className="font-medium text-gray-900">
                  {formatPercentage(rate)}
                </span>
              </div>
            )) : (
              <div className="text-sm text-gray-500">Aucune donnée disponible</div>
            )}
          </div>
        </div>

        {/* Average Time by Stage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Temps Moyen par Étape
          </h3>
          <div className="space-y-2">
            {metrics.averageTimeByStage ? Object.entries(metrics.averageTimeByStage).map(([stageId, time]) => (
              <div key={stageId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Étape {stageId}</span>
                <span className="font-medium text-gray-900">
                  {formatDays(time)}
                </span>
              </div>
            )) : (
              <div className="text-sm text-gray-500">Aucune donnée disponible</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
