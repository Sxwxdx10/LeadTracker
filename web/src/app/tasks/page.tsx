'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import TasksDashboard from './components/TasksDashboard';
import TasksList from './components/TasksList';
import TaskFormModal from './components/TaskFormModal';
import { DeleteConfirmationModal } from '@/components/ui/confirmation-modal';
import { SimpleToastContainer, useSimpleToast } from '@/components/ui/simple-toast';
import { useTasks } from '@/hooks/useTasks';
import { Task, CreateTaskDto, UpdateTaskDto } from '@/types/task';
import { Button } from '@/components/ui/button';

export default function TasksPage() {
  const {
    tasks,
    stats,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refreshTasks,
  } = useTasks({ autoLoad: true });

  const toast = useSimpleToast();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handler: Open create modal
  const handleOpenCreateModal = () => {
    setSelectedTask(null);
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  // Handler: Open edit modal
  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  // Handler: Close form modal
  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedTask(null);
  };

  // Handler: Submit form (create or edit)
  const handleSubmitForm = async (data: CreateTaskDto | UpdateTaskDto) => {
    try {
      if (modalMode === 'create') {
        const newTask = await createTask(data as CreateTaskDto);
        if (newTask) {
          toast.success('Tâche créée', 'La tâche a été créée avec succès.');
          handleCloseFormModal();
        } else {
          toast.error('Erreur', 'Impossible de créer la tâche.');
        }
      } else if (modalMode === 'edit' && selectedTask) {
        const updatedTask = await updateTask(selectedTask.id, data as UpdateTaskDto);
        if (updatedTask) {
          toast.success('Tâche modifiée', 'La tâche a été mise à jour avec succès.');
          handleCloseFormModal();
        } else {
          toast.error('Erreur', 'Impossible de modifier la tâche.');
        }
      }
    } catch (err) {
      console.error('Error submitting task form:', err);
      toast.error('Erreur', 'Une erreur est survenue lors de l\'enregistrement.');
    }
  };

  // Handler: Open delete confirmation modal
  const handleOpenDeleteModal = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  // Handler: Confirm delete
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteTask(taskToDelete);
      if (success) {
        toast.success('Tâche supprimée', 'La tâche a été supprimée avec succès.');
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
      } else {
        toast.error('Erreur', 'Impossible de supprimer la tâche.');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Erreur', 'Une erreur est survenue lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      const completedTask = await completeTask(taskId);
      if (completedTask) {
        toast.success('Tâche terminée', 'La tâche a été marquée comme terminée.');
      } else {
        toast.error('Erreur', 'Impossible de terminer la tâche.');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Erreur', 'Une erreur est survenue.');
    }
  };

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des tâches</h1>
            <p className="mt-1 text-sm text-gray-600">
              Organisez et suivez vos tâches quotidiennes
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <Button
              onClick={refreshTasks}
              variant="outline"
              className="mt-4"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des tâches</h1>
              <p className="mt-1 text-sm text-gray-600">
                Organisez et suivez vos tâches quotidiennes
              </p>
            </div>
            <Button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nouvelle tâche
            </Button>
          </div>
        </div>
        {/* Dashboard Stats */}
        <TasksDashboard stats={stats} loading={loading} />

        {/* Tasks List */}
        <div className="mt-8">
          <TasksList
            tasks={tasks}
            loading={loading}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onComplete={handleCompleteTask}
          />
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmitForm}
        task={selectedTask}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer la tâche"
        message="Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeleting}
      />

      {/* Toast Container */}
      <SimpleToastContainer />
    </div>
  );
}
