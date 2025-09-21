'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error';
import EmptyState from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useLeads, useDeleteLead } from '@/hooks/useLeads';
import { Lead, LeadQueryParams, LeadStatus } from '@/types/lead';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  searchParams?: LeadQueryParams;
  onParamsChange?: (params: LeadQueryParams) => void;
}

// Fonction utilitaire pour formater la devise
const formatCurrency = (value?: number) => {
  if (!value) return '-';
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
};

// Fonction utilitaire pour formater la date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

// Fonction utilitaire pour obtenir la variante du badge selon le statut
const getStatusBadgeVariant = (status: LeadStatus) => {
  switch (status) {
    case 'Open':
      return 'info';
    case 'InProgress':
      return 'warning';
    case 'Qualified':
      return 'success';
    case 'Won':
      return 'success';
    case 'Lost':
      return 'destructive';
    case 'Unqualified':
      return 'secondary';
    default:
      return 'default';
  }
};

// Fonction utilitaire pour traduire le statut
const translateStatus = (status: LeadStatus) => {
  const translations = {
    'Open': 'Ouvert',
    'InProgress': 'En cours',
    'Qualified': 'Qualifié',
    'Unqualified': 'Non qualifié',
    'Won': 'Gagné',
    'Lost': 'Perdu',
  };
  return translations[status] || status;
};

export default function LeadsTable({ searchParams, onParamsChange }: LeadsTableProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState(searchParams?.sortBy || 'createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    searchParams?.sortDirection || 'desc'
  );

  const queryParams = useMemo(() => ({
    ...searchParams,
    sortBy,
    sortDirection,
  }), [searchParams, sortBy, sortDirection]);

  const { data: leadsData, isLoading, error } = useLeads(queryParams);
  const deleteLeadMutation = useDeleteLead();

  const handleSort = (column: string) => {
    const newDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDirection(newDirection);
    
    if (onParamsChange) {
      onParamsChange({
        ...queryParams,
        sortBy: column,
        sortDirection: newDirection,
      });
    }
  };

  const handleView = (lead: Lead) => {
    router.push(`/leads/${lead.id}`);
  };

  const handleEdit = (lead: Lead) => {
    router.push(`/leads/${lead.id}/edit`);
  };

  const handleDelete = async (lead: Lead) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le lead "${lead.title}" ?`)) {
      try {
        await deleteLeadMutation.mutateAsync(lead.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: string; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        onClick={() => handleSort(column)}
        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
      >
        <span>{children}</span>
        {sortBy === column && (
          sortDirection === 'asc' ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )
        )}
      </button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <SkeletonTable 
        rows={5} 
        columns={9} 
        className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden" 
      />
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Erreur lors du chargement des leads"
        message={error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite'}
        className="py-12"
      />
    );
  }

  if (!leadsData?.data?.length) {
    return (
      <EmptyState
        icon={UserIcon}
        title="Aucun lead trouvé"
        description="Commencez par créer un nouveau lead."
        action={{
          label: 'Créer un lead',
          onClick: () => router.push('/leads/new'),
        }}
        className="py-12"
      />
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader column="title">Lead</SortableHeader>
            <SortableHeader column="email">Contact</SortableHeader>
            <SortableHeader column="company">Entreprise</SortableHeader>
            <SortableHeader column="estimatedValue">Valeur</SortableHeader>
            <SortableHeader column="probability">Probabilité</SortableHeader>
            <SortableHeader column="status">Statut</SortableHeader>
            <SortableHeader column="expectedCloseDate">Date prévue</SortableHeader>
            <SortableHeader column="createdAt">Créé le</SortableHeader>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsData.data.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-gray-50">
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{lead.title}</div>
                  <div className="text-sm text-gray-500">
                    {lead.firstName} {lead.lastName}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {lead.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{lead.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {lead.company && (
                  <div className="flex items-center text-sm">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{lead.company}</div>
                      {lead.jobTitle && (
                        <div className="text-gray-500">{lead.jobTitle}</div>
                      )}
                    </div>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {lead.estimatedValue && (
                  <div className="flex items-center text-sm font-medium">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-500 flex-shrink-0" />
                    {formatCurrency(lead.estimatedValue)}
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {lead.probability !== undefined && (
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all"
                        style={{ width: `${lead.probability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {lead.probability}%
                    </span>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <Badge variant={getStatusBadgeVariant(lead.status)}>
                  {translateStatus(lead.status)}
                </Badge>
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {formatDate(lead.expectedCloseDate)}
                </span>
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {formatDate(lead.createdAt)}
                </span>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(lead)}
                    className="h-8 w-8 p-0"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(lead)}
                    className="h-8 w-8 p-0"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lead)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    loading={deleteLeadMutation.isPending}
                    disabled={deleteLeadMutation.isPending}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
