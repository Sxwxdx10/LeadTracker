'use client';

import React from 'react';
import {
  UserGroupIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useLeadStats } from '@/hooks/useLeads';
import { SkeletonCard } from '@/components/ui/skeleton';

export function LeadStats() {
  const { data: stats, isLoading, error } = useLeadStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  };

  const formatPercentage = (value: number) => {
    return `${(value ?? 0).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  const statCards = [
    {
      name: 'Total Leads',
      value: stats.totalLeads ?? 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      format: (val: number) => (val ?? 0).toString(),
    },
    {
      name: 'Leads Qualifiés',
      value: stats.qualifiedLeads ?? 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      format: (val: number) => (val ?? 0).toString(),
    },
    {
      name: 'Valeur Totale',
      value: stats.totalValue ?? 0,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      format: formatCurrency,
    },
    {
      name: 'Taux de Conversion',
      value: stats.conversionRate ?? 0,
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      format: formatPercentage,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 border border-gray-200"
        >
          <dt>
            <div className={`absolute rounded-md ${stat.color} p-3`}>
              <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              {stat.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {stat.format(stat.value)}
            </p>
          </dd>
        </div>
      ))}
    </div>
  );
}

