'use client';

import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Task, TaskPriority } from '@/types/task';
import EmptyState from '@/components/ui/empty-state';
import Loading from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

interface TasksListProps {
  tasks: Task[];
  loading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

const filterOptions = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'overdue', label: 'En retard' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'completed', label: 'Terminées' }
];

const priorityColors: Record<TaskPriority, string> = {
  'Urgent': 'bg-red-100 text-red-800',
  'High': 'bg-orange-100 text-orange-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800'
};

const priorityLabels: Record<TaskPriority, string> = {
  'Urgent': 'Urgente',
  'High': 'Élevée',
  'Medium': 'Moyenne',
  'Low': 'Basse'
};

const statusLabels = {
  'Pending': 'À faire',
  'Completed': 'Terminée',
  'Cancelled': 'Annulée'
};

export default function TasksList({ tasks, loading = false, onEdit, onDelete, onComplete }: TasksListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('today');

  const handleFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setActiveTab(value);
    }
  };

  // Filter tasks based on active tab and search query
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return tasks.filter(task => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      const dueDate = new Date(task.dueDate);
      const isPending = task.status === 'Pending';
      const isCompleted = task.status === 'Completed';
      const isOverdue = isPending && dueDate < now;
      const isToday = dueDate >= todayStart && dueDate < todayEnd;
      const isUpcoming = isPending && dueDate >= now && !isToday;

      // Tab filter
      if (activeTab === 'today') {
        return isToday && isPending;
      } else if (activeTab === 'overdue') {
        return isOverdue;
      } else if (activeTab === 'upcoming') {
        return isUpcoming;
      } else if (activeTab === 'completed') {
        return isCompleted;
      }
      
      return true;
    });
  }, [tasks, searchQuery, activeTab]);

  // Render task card
  const renderTaskCard = (task: Task, borderColor: string) => {
    const isCompleted = task.status === 'Completed';
    
    return (
      <div key={task.id} className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${borderColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-lg font-medium text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              <Badge className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
              <Badge className={task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {statusLabels[task.status]}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-gray-600 mb-3">{task.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CalendarDaysIcon className="h-4 w-4" />
                {formatDate(task.dueDate)}
              </div>
              {task.assignedUserName && (
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  {task.assignedUserName}
                </div>
              )}
              {task.durationMinutes && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {task.durationMinutes} min
                </div>
              )}
              {task.hasReminder && (
                <div className="flex items-center gap-1 text-purple-600">
                  <BellAlertIcon className="h-4 w-4" />
                  Rappel
                </div>
              )}
            </div>
            
            {task.leadTitle && (
              <div className="mt-2 text-sm text-gray-500">
                Lead: <span className="font-medium">{task.leadTitle}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete(task.id)}
                className="text-green-600 hover:text-green-700"
                title="Marquer comme terminée"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(task)}
              title="Modifier"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-700"
              title="Supprimer"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={activeTab}
              onChange={handleFilterChange}
              options={filterOptions}
            />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="today">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" />
            Aujourd'hui
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            En retard
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            À venir
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Terminées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CalendarDaysIcon}
              title="Aucune tâche pour aujourd'hui"
              description="Vous n'avez pas de tâche prévue pour aujourd'hui."
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => renderTaskCard(task, 'border-brand-500'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={ExclamationTriangleIcon}
              title="Aucune tâche en retard"
              description="Bravo ! Vous n'avez pas de tâche en retard."
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => renderTaskCard(task, 'border-red-500'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="Aucune tâche à venir"
              description="Vous n'avez pas de tâche planifiée pour plus tard."
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => renderTaskCard(task, 'border-yellow-500'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircleIcon}
              title="Aucune tâche terminée"
              description="Vous n'avez pas encore terminé de tâche."
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => renderTaskCard(task, 'border-green-500'))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
