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
import { useToast } from '@/hooks/useToast';

interface LeadsTableProps {
  searchParams?: LeadQueryParams;
  onParamsChange?: (params: LeadQueryParams) => void;
  leads?: Lead[];
  totalCount?: number;
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

export default function LeadsTable({ searchParams, onParamsChange, leads, totalCount }: LeadsTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [sortBy, setSortBy] = useState(searchParams?.sortBy || 'createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    searchParams?.sortDirection || 'desc'
  );

  const queryParams = useMemo(() => ({
    ...searchParams,
    sortBy,
    sortDirection,
  }), [searchParams, sortBy, sortDirection]);

  // Fonction de tri côté client
  const sortLeads = useMemo(() => {
    if (!leads) return [];
    
    return [...leads].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'firstName':
          aValue = (a.firstName || '').toLowerCase();
          bValue = (b.firstName || '').toLowerCase();
          break;
        case 'lastName':
          aValue = (a.lastName || '').toLowerCase();
          bValue = (b.lastName || '').toLowerCase();
          break;
        case 'company':
          aValue = (a.company || '').toLowerCase();
          bValue = (b.company || '').toLowerCase();
          break;
        case 'estimatedValue':
          aValue = a.estimatedValue || 0;
          bValue = b.estimatedValue || 0;
          break;
        case 'probability':
          aValue = a.probability || 0;
          bValue = b.probability || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'expectedCloseDate':
          aValue = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
          bValue = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortBy, sortDirection]);

  // Utiliser les données passées en props au lieu de l'API
  const leadsData = leads ? { data: sortLeads, totalCount: totalCount || leads.length } : null;
  const isLoading = false; // Pas de loading car les données sont déjà chargées
  const error = null; // Pas d'erreur car les données sont déjà chargées
  
  const deleteLeadMutation = useDeleteLead();

  const handleSort = (column: string) => {
    const newDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDirection(newDirection);
    
    // Le tri est maintenant géré côté client, pas besoin de passer par l'API
    // Mais on peut toujours notifier le parent si nécessaire
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
        toast.success(
          'Lead supprimé',
          `Le lead "${lead.title}" a été supprimé avec succès`
        );
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error(
          'Erreur de suppression',
          'Impossible de supprimer le lead. Veuillez réessayer.',
          {
            action: {
              label: 'Réessayer',
              onClick: () => handleDelete(lead)
            }
          }
        );
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
        description={leadsData?.totalCount === 0 
          ? "Commencez par créer un nouveau lead."
          : "Aucun résultat ne correspond à vos critères de recherche."
        }
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
      {/* Header avec compteur de résultats */}
      <div className="px-6 lg:px-8 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Résultats
          </h3>
          <span className="text-sm text-gray-500">
            {leadsData.totalCount} lead{leadsData.totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="title" className="min-w-[200px]">Lead</SortableHeader>
              <SortableHeader column="email" className="min-w-[180px]">Contact</SortableHeader>
              <SortableHeader column="company" className="min-w-[160px]">Entreprise</SortableHeader>
              <SortableHeader column="estimatedValue" className="min-w-[120px]">Valeur</SortableHeader>
              <SortableHeader column="probability" className="min-w-[140px]">Probabilité</SortableHeader>
              <SortableHeader column="status" className="min-w-[100px]">Statut</SortableHeader>
              <SortableHeader column="expectedCloseDate" className="min-w-[130px]">Date prévue</SortableHeader>
              <SortableHeader column="createdAt" className="min-w-[130px]">Créé le</SortableHeader>
              <TableHead className="w-32 text-right">Actions</TableHead>
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
                  <div className="flex items-center text-sm font-medium whitespace-nowrap">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-500 flex-shrink-0" />
                    {formatCurrency(lead.estimatedValue)}
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {lead.probability !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-[80px] bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all"
                        style={{ width: `${lead.probability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
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
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
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
    </div>
  );
}
