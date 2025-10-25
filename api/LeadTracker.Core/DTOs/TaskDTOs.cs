using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for creating a new task
/// </summary>
public class CreateTaskDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "Call";
    
    [Required]
    public DateTime DueDate { get; set; }
    
    [MaxLength(20)]
    public string Priority { get; set; } = "Medium";
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    public Guid? LeadId { get; set; }
    
    public Guid? AssignedUserId { get; set; }
}

/// <summary>
/// DTO for updating an existing task
/// </summary>
public class UpdateTaskDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "Call";
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";
    
    [Required]
    public DateTime DueDate { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    [MaxLength(20)]
    public string Priority { get; set; } = "Medium";
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    /// <summary>
    /// Duration in minutes (for completed tasks)
    /// </summary>
    public int? DurationMinutes { get; set; }
    
    public Guid? LeadId { get; set; }
    
    public Guid? AssignedUserId { get; set; }
}

/// <summary>
/// DTO for task response
/// </summary>
public class TaskResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int? DurationMinutes { get; set; }
    public Guid? LeadId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Related data
    public string? LeadTitle { get; set; }
    public string? AssignedUserName { get; set; }
    public bool IsOverdue { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsToday { get; set; }
}

/// <summary>
/// DTO for task list response with pagination
/// </summary>
public class TaskListResponseDto
{
    public List<TaskResponseDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}

/// <summary>
/// DTO for task query parameters
/// </summary>
public class TaskQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Guid? LeadId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public DateTime? DueFrom { get; set; }
    public DateTime? DueTo { get; set; }
    public string? SortBy { get; set; } = "DueDate";
    public string? SortDirection { get; set; } = "asc";
}
