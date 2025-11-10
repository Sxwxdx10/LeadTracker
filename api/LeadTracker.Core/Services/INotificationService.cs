using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for managing in-app notifications
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Get paginated list of notifications for a user
    /// </summary>
    Task<NotificationListResponseDto> GetNotificationsAsync(Guid userId, NotificationQueryDto query);
    
    /// <summary>
    /// Get notification by ID
    /// </summary>
    Task<NotificationResponseDto?> GetNotificationByIdAsync(Guid id);
    
    /// <summary>
    /// Create a new notification
    /// </summary>
    Task<NotificationResponseDto> CreateNotificationAsync(CreateNotificationDto createDto);
    
    /// <summary>
    /// Mark a notification as read
    /// </summary>
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId);
    
    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    Task<int> MarkAllAsReadAsync(Guid userId);
    
    /// <summary>
    /// Get count of unread notifications for a user
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid userId);
    
    /// <summary>
    /// Delete a notification
    /// </summary>
    Task<bool> DeleteNotificationAsync(Guid notificationId, Guid userId);
    
    /// <summary>
    /// Delete old read notifications (for cleanup/archiving)
    /// </summary>
    Task<int> DeleteOldReadNotificationsAsync(int daysOld = 30);
}

