using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// API Controller for managing in-app notifications
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        ITenantContext tenantContext,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Get notifications for the current user with pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<NotificationListResponseDto>> GetNotifications([FromQuery] NotificationQueryDto query)
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _notificationService.GetNotificationsAsync(_tenantContext.UserId.Value, query);
        return Ok(result);
    }

    /// <summary>
    /// Get notification by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationResponseDto>> GetNotificationById(Guid id)
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return Unauthorized();
        }

        var notification = await _notificationService.GetNotificationByIdAsync(id);
        
        if (notification == null)
        {
            return NotFound();
        }

        // Ensure user can only access their own notifications
        if (notification.UserId != _tenantContext.UserId.Value)
        {
            return Forbid();
        }

        return Ok(notification);
    }

    /// <summary>
    /// Get count of unread notifications for current user
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountResponseDto>> GetUnreadCount()
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return Unauthorized();
        }

        var count = await _notificationService.GetUnreadCountAsync(_tenantContext.UserId.Value);
        return Ok(new UnreadCountResponseDto { Count = count });
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return Unauthorized();
        }

        var success = await _notificationService.MarkAsReadAsync(id, _tenantContext.UserId.Value);
        
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>
    /// Mark all notifications as read for current user
    /// </summary>
    [HttpPut("mark-all-read")]
    public async Task<ActionResult<int>> MarkAllAsRead()
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return Unauthorized();
        }

        var count = await _notificationService.MarkAllAsReadAsync(_tenantContext.UserId.Value);
        return Ok(new { markedCount = count });
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteNotification(Guid id)
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return Unauthorized();
        }

        var success = await _notificationService.DeleteNotificationAsync(id, _tenantContext.UserId.Value);
        
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}

