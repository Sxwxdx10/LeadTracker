'use client';

import React, { useState } from 'react';
import { 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Task, TaskType, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCreationForm } from '@/components/forms/TaskCreationForm';
import { TaskEditForm } from '@/components/forms/TaskEditForm';
import { formatDateTime, formatDate } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  leadId: string;
  isLoading?: boolean;
  onCreateTask?: (task: Partial<Task>) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
}

// Function to get status badge variant
const getStatusBadgeVariant = (status: TaskStatus) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};

// Function to get priority badge variant
const getPriorityBadgeVariant = (priority: TaskPriority) => {
  switch (priority) {
    case 'Low':
      return 'secondary';
    case 'Medium':
      return 'default';
    case 'High':
      return 'warning';
    case 'Urgent':
      return 'destructive';
    default:
      return 'default';
  }
};

// Function to get type icon
const getTypeIcon = (type: TaskType) => {
  switch (type) {
    case 'Call':
      return '📞';
    case 'Email':
      return '📧';
    case 'Meeting':
      return '🤝';
    case 'Follow-up':
      return '🔄';
    case 'Note':
      return '📝';
    case 'Document':
      return '📄';
    default:
      return '📋';
  }
};

// Function to translate status
const translateStatus = (status: TaskStatus) => {
  const translations = {
    'Pending': 'En attente',
    'Completed': 'Terminé',
    'Cancelled': 'Annulé'
  };
  return translations[status] || status;
};

// Function to translate priority
const translatePriority = (priority: TaskPriority) => {
  const translations = {
    'Low': 'Faible',
    'Medium': 'Moyenne',
    'High': 'Élevée',
    'Urgent': 'Urgente'
  };
  return translations[priority] || priority;
};

// Function to translate type
const translateType = (type: TaskType) => {
  const translations = {
    'Call': 'Appel',
    'Email': 'Email',
    'Meeting': 'Réunion',
    'Follow-up': 'Suivi',
    'Note': 'Note',
    'Document': 'Document'
  };
  return translations[type] || type;
};

export function TaskList({ 
  tasks, 
  leadId, 
  isLoading, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask 
}: TaskListProps) {
  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="mt-3 flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleTaskComplete = async (task: Task) => {
    try {
      // Use the complete endpoint instead of update
      const { tasksApi } = await import('@/lib/tasksApi');
      await tasksApi.completeTask(task.id);
      
      // Refresh the task list via the parent's update handler
      if (onUpdateTask) {
        // This will trigger a refresh
        onUpdateTask(task.id, {});
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleTaskDelete = (task: Task) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.title}" ?`)) {
      if (onDeleteTask) {
        onDeleteTask(task.id);
      }
    }
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskUpdate = async (id: string, updates: Partial<Task>) => {
    if (onUpdateTask) {
      await onUpdateTask(id, updates);
      setEditingTask(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Tâches associées ({safeTasks.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <TaskCreationForm
          leadId={leadId}
          onSubmit={async (taskData) => {
            if (onCreateTask) {
              await onCreateTask(taskData);
            }
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
          isLoading={false}
        />
      )}

      {/* Edit Task Form */}
      {editingTask && (
        <TaskEditForm
          task={editingTask}
          onSubmit={handleTaskUpdate}
          onCancel={handleCancelEdit}
          isLoading={false}
        />
      )}

      {/* Task List */}
      {safeTasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Aucune tâche
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Créez votre première tâche pour commencer à suivre les activités.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeTasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 transition-all ${
                task.isOverdue && task.status !== 'Completed'
                  ? 'border-red-200 bg-red-50'
                  : task.status === 'Completed'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(task.type)}</span>
                    <h4 className={`font-medium ${
                      task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h4>
                  </div>
                  
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {translateStatus(task.status)}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(task.priority)}>
                      {translatePriority(task.priority)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {translateType(task.type)}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Échéance: {formatDateTime(task.dueDate)}
                    </div>
                    
                    {task.assignedUserName && (
                      <div className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {task.assignedUserName}
                      </div>
                    )}
                    
                    {task.completedAt && (
                      <div className="flex items-center text-green-600">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Terminé le {formatDateTime(task.completedAt)}
                      </div>
                    )}
                  </div>
                  
                  {task.isOverdue && task.status !== 'Completed' && (
                    <div className="mt-2 flex items-center text-red-600 text-xs">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      En retard
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {task.status !== 'Completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTaskComplete(task)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTaskEdit(task)}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTaskDelete(task)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
