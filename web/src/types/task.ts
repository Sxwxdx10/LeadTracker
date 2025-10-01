export type TaskType = 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Note' | 'Document';
export type TaskStatus = 'Pending' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: string;
  completedAt?: string;
  priority: TaskPriority;
  notes?: string;
  durationMinutes?: number;
  leadId?: string;
  assignedUserId?: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Computed properties
  isOverdue: boolean;
  isCompleted: boolean;
  isToday: boolean;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  dueDate: string;
  priority?: TaskPriority;
  notes?: string;
  leadId?: string;
  assignedUserId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  dueDate?: string;
  priority?: TaskPriority;
  notes?: string;
  durationMinutes?: number;
  completedAt?: string | undefined;
  assignedUserId?: string;
}

export interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  leadId?: string;
  assignedUserId?: string;
  status?: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
}

export interface PaginatedTasksResponse {
  data: Task[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Activity types for timeline
export interface Activity {
  id: string;
  type: 'task_completed' | 'task_created' | 'lead_status_changed' | 'lead_updated' | 'note_added' | 'call_made' | 'email_sent' | 'meeting_scheduled';
  title: string;
  description?: string;
  timestamp: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface ActivityTimeline {
  activities: Activity[];
  totalCount: number;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  leadId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
  leadId: string;
}

export interface UpdateCommentDto {
  content: string;
}

// Attachment types
export interface Attachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  leadId: string;
  uploadedBy: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
}

export interface UploadAttachmentDto {
  file: File;
  leadId: string;
  description?: string;
}
