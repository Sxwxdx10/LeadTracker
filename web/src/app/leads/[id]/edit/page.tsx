'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLead, useUpdateLead, useStages } from '@/hooks/useLeads';
import { UpdateLeadDto, LeadStatus } from '@/types/lead';
import { Skeleton } from '@/components/ui/skeleton';

interface EditLeadFormData extends UpdateLeadDto {}

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'Open', label: 'Ouvert' },
  { value: 'InProgress', label: 'En cours' },
  { value: 'Qualified', label: 'Qualifié' },
  { value: 'Unqualified', label: 'Non qualifié' },
  { value: 'Won', label: 'Gagné' },
  { value: 'Lost', label: 'Perdu' },
];

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;
  
  const { data: lead, isLoading, error } = useLead(leadId);
  const updateLeadMutation = useUpdateLead();
  const { data: stages } = useStages();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<EditLeadFormData>({
    defaultValues: {
      probability: 50,
    },
  });

  // Reset form when lead data is loaded
  useEffect(() => {
    if (lead) {
      reset({
        title: lead.title,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phoneNumber: lead.phoneNumber || '',
        company: lead.company || '',
        jobTitle: lead.jobTitle || '',
        estimatedValue: lead.estimatedValue,
        probability: lead.probability || 50,
        expectedCloseDate: lead.expectedCloseDate || '',
        notes: lead.notes || '',
        source: lead.source || '',
        status: lead.status,
        stageId: lead.stageId,
      } as EditLeadFormData);
    }
  }, [lead, reset]);

  const onSubmit = async (data: EditLeadFormData) => {
    try {
      // Convertir les chaînes vides en undefined et s'assurer que les champs requis sont présents
      const cleanData: UpdateLeadDto = {
        title: data.title!,
        firstName: data.firstName!,
        lastName: data.lastName!,
        email: data.email!,
        status: data.status!,
        stageId: data.stageId!,
        ...(data.phoneNumber?.trim() && { phoneNumber: data.phoneNumber.trim() }),
        ...(data.company?.trim() && { company: data.company.trim() }),
        ...(data.jobTitle?.trim() && { jobTitle: data.jobTitle.trim() }),
        ...(data.notes?.trim() && { notes: data.notes.trim() }),
        ...(data.source?.trim() && { source: data.source.trim() }),
        ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.expectedCloseDate && { expectedCloseDate: data.expectedCloseDate }),
      };

      await updateLeadMutation.mutateAsync({ id: leadId, data: cleanData });
      router.push(`/leads/${leadId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du lead:', error);
    }
  };

  const handleBack = () => {
    router.back();
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
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
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
                <h1 className="text-2xl font-bold text-gray-900">Modifier le lead</h1>
                <p className="text-sm text-gray-600">
                  {lead.firstName} {lead.lastName}
                  {lead.company && ` • ${lead.company}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Informations de base */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Informations de base
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du lead *
                </label>
                <Input
                  id="title"
                  type="text"
                  {...register('title', { required: 'Le titre est requis' })}
                  placeholder="Ex: Nouveau client potentiel"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="stageId" className="block text-sm font-medium text-gray-700 mb-2">
                  Étape *
                </label>
                <select
                  id="stageId"
                  {...register('stageId', { required: 'L\'étape est requise' })}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <option value="">Sélectionner une étape</option>
                  {stages?.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {errors.stageId && (
                  <p className="mt-1 text-sm text-red-600">{errors.stageId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <Input
                  id="firstName"
                  type="text"
                  {...register('firstName', { required: 'Le prénom est requis' })}
                  placeholder="Jean"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de famille *
                </label>
                <Input
                  id="lastName"
                  type="text"
                  {...register('lastName', { required: 'Le nom de famille est requis' })}
                  placeholder="Dupont"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Adresse email invalide'
                    }
                  })}
                  placeholder="jean.dupont@exemple.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...register('phoneNumber', {
                    pattern: {
                      value: /^\+?1\d{10}$/,
                      message: 'Format requis: +1XXXXXXXXXX (format canadien)'
                    }
                  })}
                  placeholder="+15551234567"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  id="status"
                  {...register('status', { required: 'Le statut est requis' })}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <option value="">Sélectionner un statut</option>
                  {LEAD_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informations entreprise */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Informations entreprise
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise
                </label>
                <Input
                  id="company"
                  type="text"
                  {...register('company')}
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Poste
                </label>
                <Input
                  id="jobTitle"
                  type="text"
                  {...register('jobTitle')}
                  placeholder="Directeur commercial"
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <Input
                  id="source"
                  type="text"
                  {...register('source')}
                  placeholder="Site web, référence, etc."
                />
              </div>
            </div>
          </div>

          {/* Informations commerciales */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Informations commerciales
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Valeur estimée (CAD)
                </label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('estimatedValue', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'La valeur doit être positive' }
                  })}
                  placeholder="50000"
                />
                {errors.estimatedValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedValue.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-2">
                  Probabilité (%)
                </label>
                <div className="space-y-2">
                  <Input
                    id="probability"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    {...register('probability', { valueAsNumber: true })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {watch('probability')}%
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de clôture prévue
                </label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  {...register('expectedCloseDate')}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Notes
            </h3>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes et commentaires
              </label>
              <textarea
                id="notes"
                rows={4}
                {...register('notes')}
                className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                placeholder="Informations supplémentaires sur ce lead..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateLeadMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateLeadMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              Sauvegarder les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
