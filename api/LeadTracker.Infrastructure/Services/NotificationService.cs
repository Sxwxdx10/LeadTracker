using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for managing in-app notifications
/// </summary>
public class NotificationService : INotificationService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<NotificationListResponseDto> GetNotificationsAsync(Guid userId, NotificationQueryDto query)
    {
        _logger.LogInformation("GetNotificationsAsync called for user {UserId}", userId);

        var notificationsQuery = _context.GetNotificationsForCurrentTenant()
            .Where(n => n.UserId == userId)
            .Include(n => n.RelatedTask)
            .Include(n => n.RelatedLead)
            .AsQueryable();

        // Apply filters
        if (query.UnreadOnly.HasValue && query.UnreadOnly.Value)
        {
            notificationsQuery = notificationsQuery.Where(n => !n.IsRead);
        }

        if (!string.IsNullOrEmpty(query.Type))
        {
            notificationsQuery = notificationsQuery.Where(n => n.Type == query.Type);
        }

        // Get total count
        var totalCount = await notificationsQuery.CountAsync();

        // Get unread count
        var unreadCount = await _context.GetNotificationsForCurrentTenant()
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();

        // Order by most recent first
        notificationsQuery = notificationsQuery.OrderByDescending(n => n.CreatedAt);

        // Apply pagination
        var notifications = await notificationsQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Map to DTOs
        var notificationDtos = notifications.Select(MapToResponseDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new NotificationListResponseDto
        {
            Data = notificationDtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.PageNumber > 1,
            HasNextPage = query.PageNumber < totalPages,
            UnreadCount = unreadCount
        };
    }

    public async Task<NotificationResponseDto?> GetNotificationByIdAsync(Guid id)
    {
        var notification = await _context.GetNotificationsForCurrentTenant()
            .Include(n => n.RelatedTask)
            .Include(n => n.RelatedLead)
            .FirstOrDefaultAsync(n => n.Id == id);

        return notification != null ? MapToResponseDto(notification) : null;
    }

    public async Task<NotificationResponseDto> CreateNotificationAsync(CreateNotificationDto createDto)
    {
        if (!_tenantContext.OrganizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = createDto.UserId,
            Type = createDto.Type,
            Title = createDto.Title,
            Message = createDto.Message,
            RelatedTaskId = createDto.RelatedTaskId,
            RelatedLeadId = createDto.RelatedLeadId,
            IsRead = false,
            OrganizationId = _tenantContext.OrganizationId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Notification {NotificationId} created for user {UserId}", notification.Id, createDto.UserId);

        return await GetNotificationByIdAsync(notification.Id) 
            ?? throw new InvalidOperationException("Failed to retrieve created notification");
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.GetNotificationsForCurrentTenant()
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}", notificationId, userId);
        }

        return true;
    }

    public async Task<int> MarkAllAsReadAsync(Guid userId)
    {
        var unreadNotifications = await _context.GetNotificationsForCurrentTenant()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (unreadNotifications.Count == 0)
        {
            return 0;
        }

        var now = DateTime.UtcNow;
        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
            notification.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Marked {Count} notifications as read for user {UserId}", unreadNotifications.Count, userId);

        return unreadNotifications.Count;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.GetNotificationsForCurrentTenant()
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    public async Task<bool> DeleteNotificationAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.GetNotificationsForCurrentTenant()
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
        {
            return false;
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Notification {NotificationId} deleted by user {UserId}", notificationId, userId);

        return true;
    }

    public async Task<int> DeleteOldReadNotificationsAsync(int daysOld = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);

        var oldNotifications = await _context.GetNotificationsForCurrentTenant()
            .Where(n => n.IsRead && n.ReadAt.HasValue && n.ReadAt.Value < cutoffDate)
            .ToListAsync();

        if (oldNotifications.Count == 0)
        {
            return 0;
        }

        _context.Notifications.RemoveRange(oldNotifications);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} old read notifications (older than {Days} days)", oldNotifications.Count, daysOld);

        return oldNotifications.Count;
    }

    private static NotificationResponseDto MapToResponseDto(Notification notification)
    {
        return new NotificationResponseDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            RelatedTaskId = notification.RelatedTaskId,
            RelatedLeadId = notification.RelatedLeadId,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedAt = notification.CreatedAt,
            UpdatedAt = notification.UpdatedAt,
            OrganizationId = notification.OrganizationId,
            RelatedTaskTitle = notification.RelatedTask?.Title,
            RelatedLeadTitle = notification.RelatedLead?.Title
        };
    }
}

