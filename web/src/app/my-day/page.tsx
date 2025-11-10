'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import type { MyDayTasksResponse, Task } from '@/types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MyDayPage() {
  const [data, setData] = useState<MyDayTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyDayTasks();
  }, []);

  const fetchMyDayTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest<MyDayTasksResponse>('/api/tasks/my-day');
      setData(response);
    } catch (err) {
      console.error('Failed to fetch my day tasks:', err);
      setError('Échec du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiRequest(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
      });
      // Refresh data
      await fetchMyDayTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const TaskCard = ({ task, showLeadInfo = true }: { task: Task; showLeadInfo?: boolean }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={() => handleCompleteTask(task.id)}
          className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
          title="Marquer comme terminé"
        >
          <CheckCircle className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900">
              {task.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(new Date(task.dueDate), 'HH:mm', { locale: fr })}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 rounded">{task.type}</span>
            {showLeadInfo && task.leadId && (
              <span className="flex items-center gap-1">
                Lead: {task.leadTitle || 'N/A'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              Assigné à: {task.assignedUserName || 'N/A'}
            </span>
            {task.leadId ? (
              <a
                href={`/leads/${task.leadId}`}
                className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Voir le lead
                <ChevronRight className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-gray-400">Aucun lead associé</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { todayTasks, thisWeekTasks, overdueTasks, totalTodayCount, totalThisWeekCount, totalOverdueCount } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-brand-600" />
          Ma Journée
        </h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aujourd'hui</p>
              <p className="text-3xl font-bold text-brand-600">{totalTodayCount}</p>
            </div>
            <Calendar className="w-12 h-12 text-brand-200" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cette semaine</p>
              <p className="text-3xl font-bold text-blue-600">{totalThisWeekCount}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En retard</p>
              <p className="text-3xl font-bold text-red-600">{totalOverdueCount}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            Tâches en retard ({totalOverdueCount})
          </h2>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div key={task.id} className="border-l-4 border-red-500">
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            Aujourd'hui ({totalTodayCount})
          </h2>
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* This Week's Tasks */}
      {thisWeekTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Cette semaine ({totalThisWeekCount})
          </h2>
          <div className="space-y-3">
            {thisWeekTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {todayTasks.length === 0 && thisWeekTasks.length === 0 && overdueTasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            Aucune tâche pour le moment
          </h3>
          <p className="text-gray-500">
            Vous êtes à jour ! Profitez de votre journée.
          </p>
        </div>
      )}
    </div>
  );
}

