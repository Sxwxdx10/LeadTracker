import { apiRequest } from './apiClient';
import type {
  Notification,
  NotificationQueryParams,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
} from '@/types/notification';

const BASE_URL = '/api/notifications';

export const notificationsApi = {
  /**
   * Get paginated list of notifications for current user
   */
  async getNotifications(params: NotificationQueryParams = {}): Promise<PaginatedNotificationsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.unreadOnly !== undefined) {
      queryParams.append('unreadOnly', params.unreadOnly.toString());
    }
    if (params.type) {
      queryParams.append('type', params.type);
    }
    if (params.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString());
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    
    return apiRequest<PaginatedNotificationsResponse>(url);
  },

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<Notification> {
    return apiRequest<Notification>(`${BASE_URL}/${id}`);
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiRequest<UnreadCountResponse>(`${BASE_URL}/unread-count`);
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    return apiRequest<void>(`${BASE_URL}/${id}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ markedCount: number }> {
    return apiRequest<{ markedCount: number }>(`${BASE_URL}/mark-all-read`, {
      method: 'PUT',
    });
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    return apiRequest<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

