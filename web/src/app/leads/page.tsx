'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadsFilters from '@/components/leads/LeadsFilters';
import Pagination from '@/components/ui/pagination';
import Loading from '@/components/ui/loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserMenu from '@/components/auth/UserMenu';
import { useLeads, useLeadStats } from '@/hooks/useLeads';
import { LeadQueryParams } from '@/types/lead';

export default function LeadsPage() {
  const router = useRouter();
  
  const [queryParams, setQueryParams] = useState<LeadQueryParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  const { data: leadsData, isLoading } = useLeads(queryParams);
  const { data: stats } = useLeadStats();

  const handleFiltersChange = useCallback((newFilters: LeadQueryParams) => {
    setQueryParams(newFilters);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  }, []);

  const formatCurrency = (value?: number) => {
    if (!value) return '0 $';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="text-sm text-gray-600">
                Gérez vos prospects et opportunités commerciales
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/leads/stats')}
                className="flex items-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                Statistiques
              </Button>
              
              <Button
                onClick={() => router.push('/leads/new')}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau lead
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        {stats && stats.totalLeads !== undefined && (
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
                        {stats.totalLeads?.toLocaleString() || '0'}
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
                        {stats.qualifiedLeads?.toLocaleString() || '0'}
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
                        {stats.conversionRate?.toFixed(1) || '0.0'}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6">
          <LeadsFilters
            filters={queryParams}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Tableau des leads */}
        <div className="space-y-4">
          <LeadsTable
            searchParams={queryParams}
            onParamsChange={handleFiltersChange}
          />

          {/* Pagination */}
          {leadsData && leadsData.totalPages > 1 && (
            <Pagination
              currentPage={leadsData.page}
              totalPages={leadsData.totalPages}
              totalCount={leadsData.totalCount}
              pageSize={leadsData.pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* État de chargement */}
        {isLoading && (
          <Loading size="md" text="Chargement des leads..." className="py-12" />
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
