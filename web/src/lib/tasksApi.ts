import axios from 'axios';
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

// Configuration de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter l'ID de l'organisation pour le multi-tenant
    const organization = localStorage.getItem('organization');
    if (organization) {
      const orgData = JSON.parse(organization);
      config.headers['X-Org-Id'] = orgData.id;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Services API pour les tâches
export const tasksApi = {
  // Récupérer la liste paginée des tâches
  getTasks: async (params?: TaskQueryParams): Promise<PaginatedTasksResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('pageNumber', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.leadId) queryParams.append('leadId', params.leadId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    
    const response = await apiClient.get(`/api/tasks?${queryParams.toString()}`);
    return response.data;
  },

  // Récupérer les tâches par lead
  getTasksByLead: async (leadId: string): Promise<Task[]> => {
    const response = await apiClient.get(`/api/tasks/lead/${leadId}`);
    return response.data;
  },

  // Récupérer une tâche par ID
  getTask: async (id: string): Promise<Task> => {
    const response = await apiClient.get(`/api/tasks/${id}`);
    return response.data;
  },

  // Créer une nouvelle tâche
  createTask: async (data: CreateTaskDto): Promise<Task> => {
    const response = await apiClient.post('/api/tasks', data);
    return response.data;
  },

  // Mettre à jour une tâche
  updateTask: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await apiClient.put(`/api/tasks/${id}`, data);
    return response.data;
  },

  // Supprimer une tâche
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/tasks/${id}`);
  },

  // Marquer une tâche comme terminée
  completeTask: async (id: string): Promise<Task> => {
    const response = await apiClient.patch(`/api/tasks/${id}/complete`);
    return response.data;
  },

  // Récupérer les activités d'un lead
  getActivities: async (leadId: string): Promise<ActivityTimeline> => {
    const response = await apiClient.get(`/api/activities/lead/${leadId}`);
    return response.data;
  },

  // Récupérer les commentaires d'un lead
  getComments: async (leadId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/api/comments/lead/${leadId}`);
    return response.data;
  },

  // Créer un commentaire
  createComment: async (data: CreateCommentDto): Promise<Comment> => {
    const response = await apiClient.post('/api/comments', data);
    return response.data;
  },

  // Mettre à jour un commentaire
  updateComment: async (id: string, data: UpdateCommentDto): Promise<Comment> => {
    const response = await apiClient.put(`/api/comments/${id}`, data);
    return response.data;
  },

  // Supprimer un commentaire
  deleteComment: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/comments/${id}`);
  },

  // Récupérer les pièces jointes d'un lead
  getAttachments: async (leadId: string): Promise<Attachment[]> => {
    const response = await apiClient.get(`/api/attachments/lead/${leadId}`);
    return response.data;
  },

  // Télécharger une pièce jointe
  uploadAttachment: async (data: UploadAttachmentDto): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('leadId', data.leadId);
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post('/api/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Supprimer une pièce jointe
  deleteAttachment: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/attachments/${id}`);
  },
};

export default tasksApi;
