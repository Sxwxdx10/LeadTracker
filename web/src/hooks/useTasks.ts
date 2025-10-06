import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
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

// Mock API functions - to be replaced with actual API calls
const tasksApi = {
  getTasks: async (params?: TaskQueryParams): Promise<PaginatedTasksResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock implementation
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Appel de suivi',
        description: 'Appeler le client pour discuter des besoins',
        type: 'Call',
        status: 'Completed',
        dueDate: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        priority: 'High',
        notes: 'Client très intéressé',
        durationMinutes: 30,
        leadId: 'lead-1',
        assignedUserId: 'user-1',
        assignedUser: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        organizationId: 'org-1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        isOverdue: false,
        isCompleted: true,
        isToday: true
      },
      {
        id: '2',
        title: 'Envoi de proposition',
        description: 'Préparer et envoyer la proposition commerciale',
        type: 'Email',
        status: 'Pending',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: 'Medium',
        leadId: 'lead-1',
        assignedUserId: 'user-1',
        assignedUser: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        organizationId: 'org-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOverdue: false,
        isCompleted: false,
        isToday: false
      }
    ];
    
    return {
      data: mockTasks,
      totalCount: mockTasks.length,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  },

  getTasksByLead: async (leadId: string): Promise<Task[]> => {
    const response = await tasksApi.getTasks({ leadId });
    return response.data;
  },

  getActivities: async (leadId: string): Promise<ActivityTimeline> => {
    // Mock activities
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'task_completed',
        title: 'Tâche terminée',
        description: 'Appel de suivi terminé',
        timestamp: new Date().toISOString(),
        userId: 'user-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        metadata: {
          taskTitle: 'Appel de suivi',
          taskType: 'Call'
        }
      },
      {
        id: '2',
        type: 'lead_status_changed',
        title: 'Statut modifié',
        description: 'Statut changé de "Ouvert" à "En cours"',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'user-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        metadata: {
          oldStatus: 'Open',
          newStatus: 'InProgress'
        }
      },
      {
        id: '3',
        type: 'lead_updated',
        title: 'Lead mis à jour',
        description: 'Informations de contact modifiées',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: 'user-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        }
      }
    ];

    return {
      activities: mockActivities,
      totalCount: mockActivities.length
    };
  },

  getComments: async (leadId: string): Promise<Comment[]> => {
    // Mock comments
    const mockComments: Comment[] = [
      {
        id: '1',
        content: 'Client très intéressé par notre solution. À suivre de près.',
        leadId,
        userId: 'user-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        content: 'Besoin de vérifier le budget disponible avant la prochaine réunion.',
        leadId,
        userId: 'user-2',
        user: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          fullName: 'Jane Smith'
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    return mockComments;
  },

  getAttachments: async (leadId: string): Promise<Attachment[]> => {
    // Mock attachments
    const mockAttachments: Attachment[] = [
      {
        id: '1',
        fileName: 'proposition_commerciale.pdf',
        originalFileName: 'Proposition Commerciale - Client ABC.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        filePath: '/uploads/leads/lead-1/proposition_commerciale.pdf',
        leadId,
        uploadedBy: 'user-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return mockAttachments;
  },

  createTask: async (data: CreateTaskDto): Promise<Task> => {
    // Mock implementation
    const newTask: Task = {
      id: Date.now().toString(),
      title: data.title,
      ...(data.description && { description: data.description }),
      type: data.type,
      dueDate: data.dueDate,
      priority: data.priority || 'Medium',
      ...(data.notes && { notes: data.notes }),
      ...(data.leadId && { leadId: data.leadId }),
      ...(data.assignedUserId && { assignedUserId: data.assignedUserId }),
      status: 'Pending',
      priority: data.priority || 'Medium',
      organizationId: 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOverdue: false,
      isCompleted: false,
      isToday: false
    };
    
    return newTask;
  },

  updateTask: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    // Mock implementation
    throw new Error('Not implemented');
  },

  deleteTask: async (id: string): Promise<void> => {
    // Mock implementation
    throw new Error('Not implemented');
  },

  createComment: async (data: CreateCommentDto): Promise<Comment> => {
    // Mock implementation
    const newComment: Comment = {
      id: Date.now().toString(),
      ...data,
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        fullName: 'John Doe'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newComment;
  },

  updateComment: async (id: string, data: UpdateCommentDto): Promise<Comment> => {
    // Mock implementation
    throw new Error('Not implemented');
  },

  deleteComment: async (id: string): Promise<void> => {
    // Mock implementation
    throw new Error('Not implemented');
  },

  uploadAttachment: async (data: UploadAttachmentDto): Promise<Attachment> => {
    // Mock implementation
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      fileName: data.file.name,
      originalFileName: data.file.name,
      fileSize: data.file.size,
      mimeType: data.file.type,
      filePath: `/uploads/leads/${data.leadId}/${data.file.name}`,
      leadId: data.leadId,
      uploadedBy: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        fullName: 'John Doe'
      },
      createdAt: new Date().toISOString()
    };
    
    return newAttachment;
  },

  deleteAttachment: async (id: string): Promise<void> => {
    // Mock implementation
    throw new Error('Not implemented');
  }
};

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: TaskQueryParams) => [...taskKeys.lists(), params] as const,
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
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.getTasks(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTasksByLead(leadId: string) {
  return useQuery({
    queryKey: taskKeys.byLead(leadId),
    queryFn: () => tasksApi.getTasksByLead(leadId),
    enabled: !!leadId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksApi.createTask(data),
    onSuccess: (newTask) => {
      if (newTask.leadId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byLead(newTask.leadId) });
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Tâche créée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création de la tâche:', error);
      toast.error(error.message || 'Erreur lors de la création de la tâche');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => 
      tasksApi.updateTask(id, data),
    onSuccess: (updatedTask, { id }) => {
      queryClient.setQueryData(taskKeys.detail(id), updatedTask);
      if (updatedTask.leadId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byLead(updatedTask.leadId) });
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Tâche mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour de la tâche');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Tâche supprimée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression de la tâche:', error);
      toast.error(error.message || 'Erreur lors de la suppression de la tâche');
    },
  });
}

// Hooks for activities
export function useActivities(leadId: string) {
  return useQuery({
    queryKey: activityKeys.byLead(leadId),
    queryFn: () => tasksApi.getActivities(leadId),
    enabled: !!leadId,
    staleTime: 2 * 60 * 1000,
  });
}

// Hooks for comments
export function useComments(leadId: string) {
  return useQuery({
    queryKey: commentKeys.byLead(leadId),
    queryFn: () => tasksApi.getComments(leadId),
    enabled: !!leadId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentDto) => tasksApi.createComment(data),
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byLead(newComment.leadId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byLead(newComment.leadId) });
      toast.success('Commentaire ajouté avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du commentaire');
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentDto }) => 
      tasksApi.updateComment(id, data),
    onSuccess: (updatedComment) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byLead(updatedComment.leadId) });
      toast.success('Commentaire mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du commentaire');
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      toast.success('Commentaire supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du commentaire:', error);
      toast.error(error.message || 'Erreur lors de la suppression du commentaire');
    },
  });
}

// Hooks for attachments
export function useAttachments(leadId: string) {
  return useQuery({
    queryKey: attachmentKeys.byLead(leadId),
    queryFn: () => tasksApi.getAttachments(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadAttachmentDto) => tasksApi.uploadAttachment(data),
    onSuccess: (newAttachment) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byLead(newAttachment.leadId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byLead(newAttachment.leadId) });
      toast.success('Fichier téléchargé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors du téléchargement du fichier:', error);
      toast.error(error.message || 'Erreur lors du téléchargement du fichier');
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
      toast.success('Fichier supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du fichier:', error);
      toast.error(error.message || 'Erreur lors de la suppression du fichier');
    },
  });
}
