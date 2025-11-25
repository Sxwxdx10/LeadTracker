'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, ClockIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreateTaskDto, TaskType, TaskPriority } from '@/types/task';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { usersApi, SimpleUser } from '@/lib/usersApi';
import { useAuth } from '@/contexts/AuthContext';

// Validation schema
const taskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  type: z.enum(['Call', 'Email', 'Meeting', 'Follow-up', 'Note', 'Document']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  dueDate: z.string().min(1, 'La date d\'échéance est requise'),
  dueTime: z.string().optional(),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional(),
  assignedUserId: z.string().min(1, 'L\'assignation est obligatoire'),
  durationMinutes: z.number().min(1, 'La durée doit être d\'au moins 1 minute').max(480, 'La durée ne peut pas dépasser 8 heures').optional(),
  // Reminder fields
  hasReminder: z.boolean().optional(),
  reminderMinutesBefore: z.number().min(1).max(10080).optional(), // Max 1 week
  // Recurrence fields
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['Daily', 'Weekly', 'Monthly', 'Custom']).optional(),
  recurrenceInterval: z.number().min(1).max(365).optional(),
  recurrenceEndDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskCreationFormProps {
  leadId?: string;
  onSubmit: (data: CreateTaskDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  assignedUsers?: SimpleUser[]; // This will be ignored, we fetch users internally
  defaultValues?: Partial<TaskFormData>;
}

// Task type options with icons and descriptions
const taskTypeOptions = [
  { value: 'Call' as const, label: 'Appel téléphonique', icon: '📞', description: 'Appel avec le client ou prospect' },
  { value: 'Email' as const, label: 'Email', icon: '📧', description: 'Envoi ou réponse à un email' },
  { value: 'Meeting' as const, label: 'Réunion', icon: '🤝', description: 'Réunion en personne ou en ligne' },
  { value: 'Follow-up' as const, label: 'Suivi', icon: '🔄', description: 'Action de suivi ou relance' },
  { value: 'Note' as const, label: 'Note', icon: '📝', description: 'Ajout de notes ou documentation' },
  { value: 'Document' as const, label: 'Document', icon: '📄', description: 'Création ou révision de document' },
];

// Priority options with colors
const priorityOptions = [
  { value: 'Low' as const, label: 'Faible', color: 'bg-gray-100 text-gray-800', description: 'Peut être fait plus tard' },
  { value: 'Medium' as const, label: 'Moyenne', color: 'bg-brand-100 text-brand-800', description: 'Priorité normale' },
  { value: 'High' as const, label: 'Élevée', color: 'bg-orange-100 text-orange-800', description: 'Important à faire rapidement' },
  { value: 'Urgent' as const, label: 'Urgente', color: 'bg-red-100 text-red-800', description: 'Très urgent, à faire immédiatement' },
];

export function TaskCreationForm({
  leadId,
  onSubmit,
  onCancel,
  isLoading = false,
  assignedUsers: providedUsers = [],
  defaultValues
}: TaskCreationFormProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<TaskType>(defaultValues?.type || 'Call');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(defaultValues?.priority || 'Medium');
  const [hasReminder, setHasReminder] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<SimpleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      type: defaultValues?.type || 'Call',
      priority: defaultValues?.priority || 'Medium',
      dueDate: defaultValues?.dueDate || '',
      dueTime: defaultValues?.dueTime || '',
      notes: defaultValues?.notes || '',
      assignedUserId: defaultValues?.assignedUserId || '',
      durationMinutes: defaultValues?.durationMinutes || 30,
      hasReminder: true,
      reminderMinutesBefore: 60,
      isRecurring: false,
      recurrencePattern: 'Daily',
      recurrenceInterval: 1,
    }
  });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedDueDate = watch('dueDate');
  const watchedDueTime = watch('dueTime');

  // Load users if admin, otherwise auto-assign to current user
  useEffect(() => {
    const fetchUsers = async () => {
      const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('Admin');
      
      if (isAdmin) {
        // Admin can assign to anyone - load all users
        try {
          setLoadingUsers(true);
          const users = await usersApi.getSimpleUsers();
          setAssignedUsers(users);
          
          // Auto-select current user as default
          if (user?.id) {
            setValue('assignedUserId', user.id);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          toast.error('Erreur', 'Impossible de charger la liste des utilisateurs');
        } finally {
          setLoadingUsers(false);
        }
      } else {
        // Non-admin: auto-assign to self
        if (user?.id) {
          setValue('assignedUserId', user.id);
          setAssignedUsers([{
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email
          }]);
        }
        setLoadingUsers(false);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Get current task type info
  const currentTypeInfo = taskTypeOptions.find(option => option.value === selectedType);
  const currentPriorityInfo = priorityOptions.find(option => option.value === selectedPriority);

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      // Combine date and time if both are provided
      let dueDate = data.dueDate;
      if (data.dueTime && data.dueDate) {
        const [hours, minutes] = data.dueTime.split(':');
        // Create date in local timezone properly
        const localDate = new Date(data.dueDate + 'T00:00:00'); // Force local timezone interpretation
        localDate.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);
        // Convert to UTC for storage
        dueDate = localDate.toISOString();
      } else if (data.dueDate) {
        // If only date is provided, treat as end of day in local timezone
        const localDate = new Date(data.dueDate + 'T00:00:00'); // Force local timezone interpretation
        localDate.setHours(23, 59, 59, 999); // End of day
        dueDate = localDate.toISOString();
      }

      // Build task data object, only including optional properties when they have values
      const taskData: CreateTaskDto = {
        title: data.title,
        type: data.type,
        dueDate,
        priority: data.priority,
        assignedUserId: data.assignedUserId, // Now required
      };

      // Conditionally add optional properties
      if (data.description) {
        taskData.description = data.description;
      }
      if (data.notes) {
        taskData.notes = data.notes;
      }
      if (leadId) {
        taskData.leadId = leadId;
      }
      
      // Reminder configuration
      if (data.hasReminder !== undefined) {
        taskData.hasReminder = data.hasReminder;
      }
      if (data.reminderMinutesBefore) {
        taskData.reminderMinutesBefore = data.reminderMinutesBefore;
      }
      
      // Recurrence configuration
      if (data.isRecurring) {
        taskData.isRecurring = data.isRecurring;
        if (data.recurrencePattern) {
          taskData.recurrencePattern = data.recurrencePattern;
        }
        if (data.recurrenceInterval) {
          taskData.recurrenceInterval = data.recurrenceInterval;
        }
        if (data.recurrenceEndDate) {
          taskData.recurrenceEndDate = data.recurrenceEndDate;
        }
      }

      await onSubmit(taskData);
      
      toast.success(
        'Tâche créée',
        `La tâche "${data.title}" a été créée avec succès`
      );
      
      reset();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(
        'Erreur de création',
        'Impossible de créer la tâche. Veuillez réessayer.'
      );
    }
  };

  const handleTypeChange = (type: TaskType) => {
    setSelectedType(type);
    setValue('type', type);
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    setSelectedPriority(priority);
    setValue('priority', priority);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Créer une nouvelle tâche
        </h3>
        <p className="text-sm text-gray-600">
          Remplissez les informations ci-dessous pour créer une nouvelle tâche.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="form-label">
            Titre de la tâche *
          </Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Ex: Appeler le client pour discuter des besoins"
            className={cn('form-input', errors.title && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
          />
          {errors.title && (
            <p className="form-error">{errors.title.message}</p>
          )}
          {watchedTitle && (
            <p className="form-help">
              {watchedTitle.length}/100 caractères
            </p>
          )}
        </div>

        {/* Type Selection */}
        <div>
          <Label className="form-label">
            Type de tâche *
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {taskTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTypeChange(option.value)}
                className={cn(
                  'p-3 border rounded-lg text-left transition-all hover:border-brand-500',
                  selectedType === option.value
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <Label className="form-label">
            Priorité *
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePriorityChange(option.value)}
                className={cn(
                  'p-3 border rounded-lg text-left transition-all hover:border-brand-500',
                  selectedPriority === option.value
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                  <Badge className={cn('text-xs', option.color)}>
                    {option.label}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Due Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dueDate" className="form-label">
              Date d'échéance *
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className={cn('form-input pl-10', errors.dueDate && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
              />
            </div>
            {errors.dueDate && (
              <p className="form-error">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dueTime" className="form-label">
              Heure (optionnel)
            </Label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="dueTime"
                type="time"
                {...register('dueTime')}
                className="form-input pl-10"
              />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="durationMinutes" className="form-label">
            Durée estimée (minutes)
          </Label>
          <Select onValueChange={(value) => setValue('durationMinutes', parseInt(value))}>
            <SelectTrigger className="form-input">
              <SelectValue placeholder="Sélectionner la durée" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 heure</SelectItem>
              <SelectItem value="90">1h30</SelectItem>
              <SelectItem value="120">2 heures</SelectItem>
              <SelectItem value="180">3 heures</SelectItem>
              <SelectItem value="240">4 heures</SelectItem>
            </SelectContent>
          </Select>
          {errors.durationMinutes && (
            <p className="form-error">{errors.durationMinutes.message}</p>
          )}
        </div>

        {/* Assigned User - Admin can choose, non-admin auto-assigned */}
        <div>
          <Label htmlFor="assignedUserId" className="form-label">
            Assigner à {(user?.roles?.includes('admin') || user?.roles?.includes('Admin')) && '*'}
          </Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {loadingUsers ? (
              <div className="form-input pl-10 flex items-center text-gray-500">
                Chargement des utilisateurs...
              </div>
            ) : (user?.roles?.includes('admin') || user?.roles?.includes('Admin')) ? (
              // Admin: Show dropdown with all users
              <Select onValueChange={(value) => setValue('assignedUserId', value)} required>
                <SelectTrigger className={cn('form-input pl-10', errors.assignedUserId && 'border-red-300')}>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {assignedUsers.length > 0 ? (
                    assignedUsers.map((assignedUser) => (
                      <SelectItem key={assignedUser.id} value={assignedUser.id}>
                        {assignedUser.fullName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users-placeholder" disabled>
                      Aucun utilisateur disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              // Non-admin: Just show current user (read-only)
              <div className="form-input pl-10 flex items-center text-gray-700 bg-gray-50 cursor-not-allowed">
                {user?.firstName} {user?.lastName} (vous)
              </div>
            )}
          </div>
          {errors.assignedUserId && (
            <p className="form-error">{errors.assignedUserId.message}</p>
          )}
          <p className="form-help">
            {(user?.roles?.includes('admin') || user?.roles?.includes('Admin'))
              ? `${assignedUsers.length} utilisateur(s) disponible(s)`
              : 'Assigné automatiquement à vous'
            }
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="form-label">
            Description
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Décrivez les détails de cette tâche..."
            rows={3}
            className={cn('form-input', errors.description && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
          {watchedDescription && (
            <p className="form-help">
              {watchedDescription.length}/500 caractères
            </p>
          )}
        </div>

        {/* Reminder Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="form-label">🔔 Rappel</Label>
              <p className="text-xs text-gray-500">Recevez un rappel avant l'échéance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={(e) => {
                  setHasReminder(e.target.checked);
                  setValue('hasReminder', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {hasReminder && (
            <div>
              <Label htmlFor="reminderMinutesBefore" className="form-label">
                Rappeler avant l'échéance
              </Label>
              <Select 
                onValueChange={(value) => setValue('reminderMinutesBefore', parseInt(value))}
                defaultValue="60"
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Sélectionner le délai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes avant</SelectItem>
                  <SelectItem value="30">30 minutes avant</SelectItem>
                  <SelectItem value="60">1 heure avant</SelectItem>
                  <SelectItem value="120">2 heures avant</SelectItem>
                  <SelectItem value="240">4 heures avant</SelectItem>
                  <SelectItem value="1440">1 jour avant</SelectItem>
                  <SelectItem value="2880">2 jours avant</SelectItem>
                  <SelectItem value="10080">1 semaine avant</SelectItem>
                </SelectContent>
              </Select>
              <p className="form-help">
                Vous recevrez un email et une notification in-app
              </p>
            </div>
          )}
        </div>

        {/* Recurrence Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="form-label">🔄 Récurrence</Label>
              <p className="text-xs text-gray-500">Créer automatiquement cette tâche de manière répétée</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  setValue('isRecurring', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-4">
              {/* Recurrence Pattern */}
              <div>
                <Label htmlFor="recurrencePattern" className="form-label">
                  Fréquence
                </Label>
                <Select 
                  onValueChange={(value) => setValue('recurrencePattern', value as any)}
                  defaultValue="Daily"
                >
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Sélectionner la fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Quotidien</SelectItem>
                    <SelectItem value="Weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="Monthly">Mensuel</SelectItem>
                    <SelectItem value="Custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recurrence Interval */}
              <div>
                <Label htmlFor="recurrenceInterval" className="form-label">
                  Intervalle
                </Label>
                <Input
                  id="recurrenceInterval"
                  type="number"
                  min="1"
                  max="365"
                  defaultValue="1"
                  {...register('recurrenceInterval', { valueAsNumber: true })}
                  className="form-input"
                />
                <p className="form-help">
                  Répéter tous les X jours/semaines/mois
                </p>
              </div>

              {/* Recurrence End Date */}
              <div>
                <Label htmlFor="recurrenceEndDate" className="form-label">
                  Date de fin (optionnel)
                </Label>
                <Input
                  id="recurrenceEndDate"
                  type="date"
                  {...register('recurrenceEndDate')}
                  className="form-input"
                />
                <p className="form-help">
                  Laisser vide pour une récurrence sans fin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="form-label">
            Notes privées
          </Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Ajoutez des notes privées pour cette tâche..."
            rows={2}
            className={cn('form-input', errors.notes && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
          />
          {errors.notes && (
            <p className="form-error">{errors.notes.message}</p>
          )}
        </div>

        {/* Preview */}
        {(watchedTitle || watchedDueDate) && (
          <div className="border-t pt-6">
            <Label className="form-label mb-3">Aperçu de la tâche</Label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentTypeInfo?.icon}</span>
                <h4 className="font-medium text-gray-900">
                  {watchedTitle || 'Titre de la tâche'}
                </h4>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <Badge className={currentPriorityInfo?.color}>
                  {currentPriorityInfo?.label}
                </Badge>
                {watchedDueDate && (
                  <span>Échéance: {new Date(watchedDueDate).toLocaleDateString('fr-FR')}</span>
                )}
                {watchedDueTime && (
                  <span>à {watchedDueTime}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            loadingText="Création..."
          >
            Créer la tâche
          </Button>
        </div>
      </form>
    </div>
  );
}
