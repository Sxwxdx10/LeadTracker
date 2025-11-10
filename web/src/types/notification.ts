export type NotificationType = 
  | 'TaskReminder' 
  | 'TaskOverdue' 
  | 'TaskAssigned' 
  | 'LeadUpdated' 
  | 'LeadStatusChanged' 
  | 'CommentMention';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedLeadId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  
  // Optional related entity details
  relatedTaskTitle?: string;
  relatedLeadTitle?: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedLeadId?: string;
}

export interface NotificationQueryParams {
  unreadOnly?: boolean;
  type?: NotificationType;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedNotificationsResponse {
  data: Notification[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

