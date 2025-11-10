'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton, SkeletonCard, SkeletonProfile } from '@/components/ui/skeleton';
import { useLead, useDeleteLead } from '@/hooks/useLeads';
import { LeadStatus } from '@/types/lead';
import { useToast } from '@/hooks/useToast';
import { useTasksByLead } from '@/hooks/useTasks';
// import { ActivityTimeline } from '@/components/lead/ActivityTimeline';
import { TaskList } from '@/components/lead/TaskList';
// import { CommentSection } from '@/components/lead/CommentSection';
// import { AttachmentSection } from '@/components/lead/AttachmentSection';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';


// Fonction utilitaire pour obtenir la variante du badge selon le statut
const getStatusBadgeVariant = (status: LeadStatus) => {
  switch (status) {
    case 'Open':
      return 'info';
    case 'Qualified':
      return 'success';
    case 'Won':
      return 'success';
    case 'Lost':
      return 'destructive';
    case 'Cancelled':
      return 'secondary';
    default:
      return 'default';
  }
};

// Fonction utilitaire pour traduire le statut
const translateStatus = (status: LeadStatus) => {
  const translations: Record<LeadStatus, string> = {
    'Open': 'Ouvert',
    'Qualified': 'Qualifié',
    'Won': 'Gagné',
    'Lost': 'Perdu',
    'Cancelled': 'Annulé',
  };
  return translations[status] || status;
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const leadId = params?.id as string;
  
  const { data: lead, isLoading, error } = useLead(leadId);
  const deleteLeadMutation = useDeleteLead();
  
  // Hooks for tasks - using our custom hook
  const { tasks, loading: tasksLoading, error: tasksError, refreshTasks } = useTasksByLead(leadId);

  const handleEdit = () => {
    router.push(`/leads/${leadId}/edit`);
  };

  const handleDelete = async () => {
    if (!lead) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le lead "${lead.title}" ?`)) {
      try {
        await deleteLeadMutation.mutateAsync(leadId);
        toast.success(
          'Lead supprimé',
          `Le lead "${lead.title}" a été supprimé avec succès`
        );
        router.push('/leads');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error(
          'Erreur de suppression',
          'Impossible de supprimer le lead. Veuillez réessayer.',
          {
            action: {
              label: 'Réessayer',
              onClick: () => handleDelete()
            }
          }
        );
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Handlers for tasks - Real implementation
  const handleCreateTask = async (taskData: any) => {
    try {
      console.log('Creating task:', taskData);
      
      // Import tasksApi
      const { tasksApi } = await import('@/lib/tasksApi');
      
      // Create task via API
      const newTask = await tasksApi.createTask(taskData);
      
      // Refresh tasks list
      await refreshTasks();
      
      toast.success('Tâche créée', `La tâche "${taskData.title}" a été créée avec succès`);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error('Erreur', error.message || 'Impossible de créer la tâche');
    }
  };

  const handleUpdateTask = async (id: string, updates: any) => {
    try {
      console.log('Updating task:', id, updates);
      
      // If updates is empty, just refresh (called after complete)
      if (Object.keys(updates).length === 0) {
        await refreshTasks();
        return;
      }
      
      const { tasksApi } = await import('@/lib/tasksApi');
      
      await tasksApi.updateTask(id, updates);
      await refreshTasks();
      
      toast.success('Tâche modifiée', 'La tâche a été modifiée avec succès');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Erreur', error.message || 'Impossible de modifier la tâche');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        return;
      }
      
      console.log('Deleting task:', id);
      
      const { tasksApi } = await import('@/lib/tasksApi');
      
      await tasksApi.deleteTask(id);
      await refreshTasks();
      
      toast.success('Tâche supprimée', 'La tâche a été supprimée avec succès');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Erreur', error.message || 'Impossible de supprimer la tâche');
    }
  };

  const handleCreateComment = async (content: string) => {
    console.log('Create comment:', content);
    toast.info('Fonctionnalité en cours', 'Les commentaires seront bientôt disponibles');
    // TODO: Implement with API
  };

  const handleUploadAttachment = async (file: File) => {
    console.log('Upload attachment:', file.name);
    toast.info('Fonctionnalité en cours', 'Les pièces jointes seront bientôt disponibles');
    // TODO: Implement with API
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-20" />
                <div className="h-6 w-px bg-gray-300" />
                <div>
                  <Skeleton className="h-8 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <SkeletonCard />
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <SkeletonCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">Erreur lors du chargement du lead</div>
            <div className="text-gray-500 text-sm mb-4">
              {error instanceof Error ? error.message : 'Lead introuvable'}
            </div>
            <Button onClick={handleBack} variant="outline">
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.title}</h1>
                <p className="text-sm text-gray-600">
                  {lead.firstName} {lead.lastName}
                  {lead.company && ` • ${lead.company}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={getStatusBadgeVariant(lead.status)}>
                {translateStatus(lead.status)}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Modifier
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                loading={deleteLeadMutation.isPending}
                loadingText="Suppression..."
                disabled={deleteLeadMutation.isPending}
              >
                <TrashIcon className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Informations principales */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informations de contact
                </h3>
                
                <div className="space-y-4">
                  {lead.email && (
                    <div className="flex items-center text-sm">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{lead.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {lead.phoneNumber && (
                    <div className="flex items-center text-sm">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{lead.phoneNumber}</div>
                      </div>
                    </div>
                  )}
                  
                  {lead.company && (
                    <div className="flex items-center text-sm">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{lead.company}</div>
                        {lead.jobTitle && (
                          <div className="text-gray-500">{lead.jobTitle}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Détails commerciaux
                </h3>
                
                <div className="space-y-4">
                  {lead.estimatedValue && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        Valeur estimée
                      </div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(lead.estimatedValue)}
                      </div>
                    </div>
                  )}
                  
                  {lead.probability !== undefined && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                        Probabilité
                      </div>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-brand-600 h-2 rounded-full transition-all"
                            style={{ width: `${lead.probability}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {lead.probability}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {lead.expectedCloseDate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        Date prévue
                      </div>
                      <div className="font-medium text-gray-900">
                        {formatDate(lead.expectedCloseDate)}
                      </div>
                    </div>
                  )}
                  
                  {lead.source && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        Source
                      </div>
                      <div className="font-medium text-gray-900">
                        {lead.source}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informations système
                </h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Créé le {formatDateTime(lead.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Modifié le {formatDateTime(lead.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="tasks">Tâches</TabsTrigger>
                {/* TODO: Uncomment when ready
                <TabsTrigger value="activities">Activités</TabsTrigger>
                <TabsTrigger value="comments">Commentaires</TabsTrigger>
                <TabsTrigger value="attachments">Pièces jointes</TabsTrigger>
                */}
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Détails du lead
                  </h3>
                  
                  {lead.notes ? (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucune note</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Ajoutez des notes pour ce lead.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TODO: Uncomment when activities are implemented
              <TabsContent value="activities" className="space-y-6">
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <ActivityTimeline 
                    activities={[]} 
                    isLoading={false} 
                  />
                </div>
              </TabsContent>
              */}

              <TabsContent value="tasks" className="space-y-6">
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <TaskList 
                    tasks={Array.isArray(tasks) ? tasks : []} 
                    leadId={leadId}
                    isLoading={tasksLoading}
                    onCreateTask={handleCreateTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                  />
                </div>
              </TabsContent>

              {/* TODO: Uncomment when comments are implemented
              <TabsContent value="comments" className="space-y-6">
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <CommentSection 
                    comments={[]} 
                    leadId={leadId}
                    isLoading={false}
                    onCreateComment={handleCreateComment}
                  />
                </div>
              </TabsContent>
              */}

              {/* TODO: Uncomment when attachments are implemented
              <TabsContent value="attachments" className="space-y-6">
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <AttachmentSection 
                    attachments={[]} 
                    leadId={leadId}
                    isLoading={false}
                    onUploadAttachment={handleUploadAttachment}
                  />
                </div>
              </TabsContent>
              */}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
