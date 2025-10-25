import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { 
  TaskQueryParams, 
  CreateTaskDto, 
  UpdateTaskDto,
  Task,
  PaginatedTasksResponse,
  Activity,
  ActivityTimeline,
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
  Attachment,
  UploadAttachmentDto
} from '@/types/task';
import { tasksApi } from '@/lib/tasksApi';

// Query keys for caching
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TaskQueryParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  byLead: (leadId: string) => [...taskKeys.all, 'lead', leadId] as const,
};

export const activityKeys = {
  all: ['activities'] as const,
  byLead: (leadId: string) => [...activityKeys.all, 'lead', leadId] as const,
};

export const commentKeys = {
  all: ['comments'] as const,
  byLead: (leadId: string) => [...commentKeys.all, 'lead', leadId] as const,
};

export const attachmentKeys = {
  all: ['attachments'] as const,
  byLead: (leadId: string) => [...attachmentKeys.all, 'lead', leadId] as const,
};

// Hooks for tasks
export function useTasks(params?: TaskQueryParams) {
  return useQuery({
    queryKey: taskKeys.list(params || {}),
    queryFn: () => tasksApi.getTasks(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTasksByLead(leadId: string) {
  return useQuery({
    queryKey: taskKeys.byLead(leadId),
    queryFn: () => tasksApi.getTasksByLead(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error to avoid infinite loops
    select: (data) => Array.isArray(data) ? data : [], // Ensure we always return an array
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksApi.createTask(data),
    onSuccess: (newTask) => {
      // Add the new task to the lead's task list cache
      if (newTask.leadId) {
        queryClient.setQueryData(
          taskKeys.byLead(newTask.leadId),
          (oldData: Task[] | undefined) => {
            if (!oldData) return [newTask];
            return [...oldData, newTask];
          }
        );
      }
      
      // Invalidate other related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Tâche créée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création de la tâche:', error);
      
      // Handle specific error types
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Données invalides';
        toast.error('Erreur de validation', message);
      } else if (error.response?.status === 401) {
        toast.error('Non autorisé', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status >= 500) {
        toast.error('Erreur serveur', 'Une erreur temporaire s\'est produite. Veuillez réessayer.');
      } else {
        toast.error('Erreur', error.response?.data?.message || 'Erreur lors de la création de la tâche');
      }
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => 
      tasksApi.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      
      // Update the task in the lead's task list cache
      if (updatedTask.leadId) {
        queryClient.setQueryData(
          taskKeys.byLead(updatedTask.leadId),
          (oldData: Task[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(task => 
              task.id === updatedTask.id ? updatedTask : task
            );
          }
        );
      }
      
      // Invalidate other related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Tâche mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la tâche');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: (_, deletedId) => {
      // Remove the task from all lead caches
      queryClient.setQueriesData(
        { queryKey: taskKeys.all },
        (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.filter((task: Task) => task.id !== deletedId);
          }
          return oldData;
        }
      );
      
      // Invalidate other related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Tâche supprimée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression de la tâche:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la tâche');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => tasksApi.completeTask(id),
    onSuccess: (completedTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.setQueryData(taskKeys.detail(completedTask.id), completedTask);
      if (completedTask.leadId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byLead(completedTask.leadId) });
      }
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Tâche terminée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la finalisation de la tâche:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la finalisation de la tâche');
    },
  });
}

// Hooks for activities
export function useActivities(leadId: string) {
  return useQuery({
    queryKey: activityKeys.byLead(leadId),
    queryFn: () => tasksApi.getActivities(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hooks for comments
export function useComments(leadId: string) {
  return useQuery({
    queryKey: commentKeys.byLead(leadId),
    queryFn: () => tasksApi.getComments(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateCommentDto) => tasksApi.createComment(data),
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byLead(newComment.leadId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byLead(newComment.leadId) });
      toast.success('Commentaire ajouté avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du commentaire');
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentDto }) => 
      tasksApi.updateComment(id, data),
    onSuccess: (updatedComment) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byLead(updatedComment.leadId) });
      toast.success('Commentaire mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du commentaire');
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      toast.success('Commentaire supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du commentaire:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du commentaire');
    },
  });
}

// Hooks for attachments
export function useAttachments(leadId: string) {
  return useQuery({
    queryKey: attachmentKeys.byLead(leadId),
    queryFn: () => tasksApi.getAttachments(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: UploadAttachmentDto) => tasksApi.uploadAttachment(data),
    onSuccess: (newAttachment) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byLead(newAttachment.leadId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byLead(newAttachment.leadId) });
      toast.success('Fichier téléchargé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors du téléchargement du fichier:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement du fichier');
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
      toast.success('Fichier supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du fichier:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du fichier');
    },
  });
}