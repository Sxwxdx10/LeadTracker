'use client';

import React, { useState, useEffect } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, CreateTaskDto, UpdateTaskDto, TaskType, TaskPriority } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { leadsApi } from '@/lib/api';
import { usersApi, SimpleUser } from '@/lib/usersApi';
import { Lead } from '@/types/lead';

// Option interface pour les selects
interface SelectOption {
  value: string;
  label: string;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => Promise<void>;
  task?: Task | null;
  mode: 'create' | 'edit';
}

const taskTypes: SelectOption[] = [
  { value: 'Call', label: 'Appel' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Réunion' },
  { value: 'Follow-up', label: 'Suivi' },
  { value: 'Note', label: 'Note' },
  { value: 'Document', label: 'Document' },
];

const priorityOptions: SelectOption[] = [
  { value: 'Low', label: 'Basse' },
  { value: 'Medium', label: 'Moyenne' },
  { value: 'High', label: 'Élevée' },
  { value: 'Urgent', label: 'Urgente' },
];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  mode,
}) => {
  const { user } = useAuth();
  
  // Form state - use interface with all string fields to avoid undefined issues
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Call' as TaskType,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '', // Optional time field
    priority: 'Medium' as TaskPriority,
    notes: '',
    leadId: '',
    assignedUserId: user?.id || '',
    hasReminder: false,
    reminderMinutesBefore: 15,
  });

  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsOptions, setLeadsOptions] = useState<SelectOption[]>([]);
  const [usersOptions, setUsersOptions] = useState<SelectOption[]>([]);

  // Load leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      if (!isOpen) return;
      
      try {
        setLoadingLeads(true);
        // Fetch all leads with a large page size to get all of them
        const response = await leadsApi.getLeads({ page: 1, pageSize: 1000 });
        setLeads(response.data);
        
        // Transform leads to select options
        const options: SelectOption[] = response.data.map(lead => {
          // Create display label with name and company
          let label = '';
          const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
          
          if (fullName && lead.company) {
            label = `${fullName} - ${lead.company}`;
          } else if (fullName) {
            label = fullName;
          } else if (lead.company) {
            label = lead.company;
          } else if (lead.title) {
            label = lead.title;
          } else {
            label = lead.email;
          }
          
          return {
            value: lead.id,
            label: label,
          };
        });
        
        setLeadsOptions(options);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchLeads();
  }, [isOpen]);

  // Load users if admin, otherwise auto-assign to current user
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('Admin');
      
      if (isAdmin) {
        // Admin can assign to anyone - load all users
        try {
          setLoadingUsers(true);
          const users = await usersApi.getSimpleUsers();
          
          const options: SelectOption[] = users.map(u => ({
            value: u.id,
            label: u.fullName || `${u.firstName} ${u.lastName}`,
          }));
          
          setUsersOptions(options);
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setLoadingUsers(false);
        }
      } else {
        // Non-admin: just set options (assignedUserId already set in initial state)
        if (user?.id) {
          setUsersOptions([{
            value: user.id,
            label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          }]);
        }
        setLoadingUsers(false);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only run when modal opens, not when user changes


  // Initialize form with task data if editing
  useEffect(() => {
    if (mode === 'edit' && task) {
      // Extract time from ISO date if available
      const taskDate = new Date(task.dueDate);
      const hours = taskDate.getHours();
      const minutes = taskDate.getMinutes();
      // Only set time if it's not end of day (23:59)
      const dueTime = (hours === 23 && minutes === 59) 
        ? '' 
        : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      setFormData({
        title: task.title,
        description: task.description || '',
        type: task.type,
        dueDate: task.dueDate.split('T')[0],
        dueTime: dueTime,
        priority: task.priority,
        notes: task.notes || '',
        leadId: task.leadId || '',
        assignedUserId: task.assignedUserId,
        hasReminder: task.hasReminder,
        reminderMinutesBefore: task.reminderMinutesBefore || 15,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        type: 'Call',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '',
        priority: 'Medium',
        notes: '',
        leadId: '',
        assignedUserId: user?.id || '',
        hasReminder: false,
        reminderMinutesBefore: 15,
      });
    }
    setErrors({});
  }, [mode, task, isOpen, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.type) {
      newErrors.type = 'Le type est requis';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'La date d\'échéance est requise';
    }

    if (!formData.assignedUserId) {
      newErrors.assignedUserId = 'L\'utilisateur assigné est requis';
    }

    if (!formData.leadId || !formData.leadId.trim()) {
      newErrors.leadId = 'Le lead est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare submit data - only include optional fields if they have values
      const trimmedDescription = formData.description.trim();
      const trimmedNotes = formData.notes.trim();
      const trimmedLeadId = formData.leadId.trim();
      
      // Convert date to UTC properly to avoid timezone issues
      let dueDate = formData.dueDate;
      if (formData.dueDate) {
        const localDate = new Date(formData.dueDate + 'T00:00:00');
        
        if (formData.dueTime) {
          // If time is provided, use it
          const [hours, minutes] = formData.dueTime.split(':');
          localDate.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);
        } else {
          // If no time, default to end of day
          localDate.setHours(23, 59, 59, 999);
        }
        
        dueDate = localDate.toISOString();
      }
      
      const submitData: any = {
        title: formData.title,
        type: formData.type,
        dueDate: dueDate,
        priority: formData.priority,
        assignedUserId: formData.assignedUserId,
        hasReminder: formData.hasReminder,
      };
      
      // Add optional fields only if they have values
      if (trimmedDescription) submitData.description = trimmedDescription;
      if (trimmedNotes) submitData.notes = trimmedNotes;
      if (trimmedLeadId) submitData.leadId = trimmedLeadId;
      if (formData.hasReminder) submitData.reminderMinutesBefore = formData.reminderMinutesBefore;

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nouvelle tâche' : 'Modifier la tâche'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead Selection (required) - FIRST FIELD */}
        <div>
          <label htmlFor="leadId" className="block text-sm font-medium text-gray-700 mb-1">
            Lead <span className="text-red-500">*</span>
          </label>
          {loadingLeads ? (
            <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-sm text-gray-500">Chargement des leads...</span>
            </div>
          ) : leadsOptions.length === 0 ? (
            <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-yellow-50">
              <span className="text-sm text-yellow-700">Aucun lead disponible</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Test avec select HTML natif */}
              <select
                id="leadId-native"
                value={formData.leadId || ''}
                onChange={(e) => handleChange('leadId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="" disabled>Sélectionner un lead...</option>
                {leadsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">{leadsOptions.length} leads disponibles</p>
            </div>
          )}
          {errors.leadId && (
            <p className="mt-1 text-sm text-red-600">{errors.leadId}</p>
          )}
        </div>

        {/* Assigned User - Admin can choose, non-admin auto-assigned */}
        <div>
          <label htmlFor="assignedUserId" className="block text-sm font-medium text-gray-700 mb-1">
            Assigner à {(user?.roles?.includes('admin') || user?.roles?.includes('Admin')) && <span className="text-red-500">*</span>}
          </label>
          {loadingUsers ? (
            <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-sm text-gray-500">Chargement...</span>
            </div>
          ) : (user?.roles?.includes('admin') || user?.roles?.includes('Admin')) ? (
            // Admin: Show dropdown with all users
            <div className="space-y-2">
              <select
                id="assignedUserId"
                value={formData.assignedUserId || ''}
                onChange={(e) => handleChange('assignedUserId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="" disabled>Sélectionner un utilisateur...</option>
                {usersOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {usersOptions.length} utilisateur(s) disponible(s)
              </p>
            </div>
          ) : (
            // Non-admin: Just show current user (read-only)
            <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center text-gray-700">
                <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>{user?.firstName} {user?.lastName} (vous)</span>
              </div>
            </div>
          )}
          {errors.assignedUserId && (
            <p className="mt-1 text-sm text-red-600">{errors.assignedUserId}</p>
          )}
          {!(user?.roles?.includes('admin') || user?.roles?.includes('Admin')) && (
            <p className="mt-1 text-xs text-gray-500">
              La tâche sera automatiquement assignée à vous
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ex: Appeler le client ABC"
            error={!!errors.title}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Détails de la tâche..."
            rows={3}
          />
        </div>

        {/* Type and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as TaskType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {taskTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priorité
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date d'échéance <span className="text-red-500">*</span>
            </label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              error={!!errors.dueDate}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 mb-1">
              Heure (optionnel)
            </label>
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => handleChange('dueTime', e.target.value)}
              placeholder="--:--"
            />
            <p className="mt-1 text-xs text-gray-500">
              Si non spécifiée, fin de journée (23:59)
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notes additionnelles..."
            rows={2}
          />
        </div>

        {/* Reminder */}
        <div className="space-y-2">
          <Checkbox
            id="hasReminder"
            checked={formData.hasReminder}
            onChange={(checked) => handleChange('hasReminder', checked)}
            label="Activer le rappel"
          />

          {formData.hasReminder && (
            <div className="ml-7">
              <label htmlFor="reminderMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                Minutes avant l'échéance
              </label>
              <Input
                id="reminderMinutes"
                type="number"
                min="0"
                value={formData.reminderMinutesBefore}
                onChange={(e) => handleChange('reminderMinutesBefore', parseInt(e.target.value) || 0)}
                placeholder="15"
              />
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'En cours...' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;

