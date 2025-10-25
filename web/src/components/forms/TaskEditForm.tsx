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
import { Task, TaskType, TaskPriority } from '@/types/task';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

// Validation schema
const taskEditSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  type: z.enum(['Call', 'Email', 'Meeting', 'Follow-up', 'Note', 'Document']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  dueDate: z.string().min(1, 'La date d\'échéance est requise'),
  dueTime: z.string().optional(),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional(),
  assignedUserId: z.string().optional(),
  durationMinutes: z.number().min(1, 'La durée doit être d\'au moins 1 minute').max(480, 'La durée ne peut pas dépasser 8 heures').optional(),
});

type TaskEditFormData = z.infer<typeof taskEditSchema>;

interface TaskEditFormProps {
  task: Task;
  onSubmit: (id: string, data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  assignedUsers?: Array<{ id: string; name: string }>;
}

const taskTypeOptions = [
  { value: 'Call', label: 'Appel', icon: '📞', description: 'Appel téléphonique' },
  { value: 'Email', label: 'Email', icon: '📧', description: 'Envoi d\'email' },
  { value: 'Meeting', label: 'Réunion', icon: '🤝', description: 'Réunion en personne ou virtuelle' },
  { value: 'Follow-up', label: 'Suivi', icon: '🔄', description: 'Suivi d\'une action précédente' },
  { value: 'Note', label: 'Note', icon: '📝', description: 'Note ou rappel' },
  { value: 'Document', label: 'Document', icon: '📄', description: 'Création ou révision de document' }
];

const priorityOptions = [
  { value: 'Low', label: 'Faible', color: 'bg-gray-100 text-gray-800', description: 'Peut attendre' },
  { value: 'Medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-800', description: 'Priorité normale' },
  { value: 'High', label: 'Élevée', color: 'bg-orange-100 text-orange-800', description: 'Important à faire' },
  { value: 'Urgent', label: 'Urgente', color: 'bg-red-100 text-red-800', description: 'Très urgent, à faire immédiatement' }
];

export function TaskEditForm({
  task,
  onSubmit,
  onCancel,
  isLoading = false,
  assignedUsers = []
}: TaskEditFormProps) {
  
  const [selectedType, setSelectedType] = useState<TaskType>(task.type);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(task.priority);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TaskEditFormData>({
    resolver: zodResolver(taskEditSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      dueTime: task.dueDate ? new Date(task.dueDate).toTimeString().slice(0, 5) : '',
      notes: task.notes || '',
      assignedUserId: task.assignedUserId || '',
      durationMinutes: task.durationMinutes || 30,
    } as TaskEditFormData
  });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedDueDate = watch('dueDate');
  const watchedDueTime = watch('dueTime');

  // Get current task type info
  const currentTypeInfo = taskTypeOptions.find(option => option.value === selectedType);
  const currentPriorityInfo = priorityOptions.find(option => option.value === selectedPriority);

  const handleFormSubmit = async (data: TaskEditFormData) => {
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
      const taskData: Partial<Task> = {
        title: data.title,
        type: data.type,
        dueDate,
        priority: data.priority,
      };

      // Conditionally add optional properties
      if (data.description) {
        taskData.description = data.description;
      }
      if (data.notes) {
        taskData.notes = data.notes;
      }
      if (data.assignedUserId) {
        taskData.assignedUserId = data.assignedUserId;
      }
      if (data.durationMinutes) {
        taskData.durationMinutes = data.durationMinutes;
      }

      await onSubmit(task.id, taskData);
      
      toast.success(
        'Tâche mise à jour',
        `La tâche "${data.title}" a été mise à jour avec succès`
      );
      
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(
        'Erreur de mise à jour',
        'Impossible de mettre à jour la tâche. Veuillez réessayer.'
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Modifier la tâche</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Entrez le titre de la tâche"
            className={cn(errors.title && 'border-red-500')}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Décrivez la tâche..."
            rows={3}
            className={cn(errors.description && 'border-red-500')}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Type and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Type */}
          <div className="space-y-2">
            <Label>Type de tâche *</Label>
            <div className="grid grid-cols-2 gap-2">
              {taskTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeChange(option.value as TaskType)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    selectedType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priorité *</Label>
            <div className="space-y-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePriorityChange(option.value as TaskPriority)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-all',
                    selectedPriority === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                    <Badge className={option.color}>
                      {option.label}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Due Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Date d'échéance *</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className={cn('pl-10', errors.dueDate && 'border-red-500')}
              />
            </div>
            {errors.dueDate && (
              <p className="text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueTime">Heure (optionnel)</Label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="dueTime"
                type="time"
                {...register('dueTime')}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Notes supplémentaires..."
            rows={3}
            className={cn(errors.notes && 'border-red-500')}
          />
          {errors.notes && (
            <p className="text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
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
            className="min-w-[120px]"
          >
            {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </div>
  );
}
