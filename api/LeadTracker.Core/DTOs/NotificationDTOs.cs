namespace LeadTracker.Core.DTOs;

/// <summary>
/// Response DTO for notification details
/// </summary>
public class NotificationResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedTaskId { get; set; }
    public Guid? RelatedLeadId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid OrganizationId { get; set; }
    
    // Optional related entity details
    public string? RelatedTaskTitle { get; set; }
    public string? RelatedLeadTitle { get; set; }
}

/// <summary>
/// DTO for creating a new notification
/// </summary>
public class CreateNotificationDto
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedTaskId { get; set; }
    public Guid? RelatedLeadId { get; set; }
}

/// <summary>
/// DTO for notification list with pagination
/// </summary>
public class NotificationListResponseDto
{
    public List<NotificationResponseDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
    public int UnreadCount { get; set; }
}

/// <summary>
/// Query parameters for filtering notifications
/// </summary>
public class NotificationQueryDto
{
    public bool? UnreadOnly { get; set; }
    public string? Type { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// DTO for unread notification count
/// </summary>
public class UnreadCountResponseDto
{
    public int Count { get; set; }
}

