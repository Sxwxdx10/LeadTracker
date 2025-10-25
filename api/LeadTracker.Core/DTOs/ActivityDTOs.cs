using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for creating a new activity
/// </summary>
public class CreateActivityDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "Note";
    
    public DateTime? ScheduledAt { get; set; }
    
    [MaxLength(500)]
    public string? Location { get; set; }
    
    public Guid? LeadId { get; set; }
}

/// <summary>
/// DTO for updating an existing activity
/// </summary>
public class UpdateActivityDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "Note";
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Planned";
    
    public DateTime? ScheduledAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    public int? DurationMinutes { get; set; }
    
    [MaxLength(500)]
    public string? Location { get; set; }
    
    [MaxLength(2000)]
    public string? Outcome { get; set; }
    
    public Guid? LeadId { get; set; }
}

/// <summary>
/// DTO for activity response
/// </summary>
public class ActivityResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ScheduledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Location { get; set; }
    public string? Outcome { get; set; }
    public Guid? LeadId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Related data
    public string? LeadTitle { get; set; }
    public string? UserName { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsOverdue { get; set; }
}

/// <summary>
/// DTO for activity list response with pagination
/// </summary>
public class ActivityListResponseDto
{
    public List<ActivityResponseDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}

/// <summary>
/// DTO for activity query parameters
/// </summary>
public class ActivityQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Guid? LeadId { get; set; }
    public Guid? UserId { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
    public DateTime? ScheduledFrom { get; set; }
    public DateTime? ScheduledTo { get; set; }
    public string? SortBy { get; set; } = "ScheduledAt";
    public string? SortDirection { get; set; } = "desc";
}

