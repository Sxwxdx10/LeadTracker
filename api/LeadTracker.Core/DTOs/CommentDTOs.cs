using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for creating a new comment
/// </summary>
public class CreateCommentDto
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public Guid? LeadId { get; set; }
    
    public Guid? TaskId { get; set; }
    
    public Guid? ActivityId { get; set; }
    
    public Guid? ParentCommentId { get; set; }
}

/// <summary>
/// DTO for updating an existing comment
/// </summary>
public class UpdateCommentDto
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// DTO for comment response
/// </summary>
public class CommentResponseDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime? EditedAt { get; set; }
    public Guid? LeadId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? ActivityId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Related data
    public string? UserName { get; set; }
    public bool IsEdited { get; set; }
    public bool IsReply { get; set; }
    public List<CommentResponseDto> Replies { get; set; } = new();
}

/// <summary>
/// DTO for comment list response with pagination
/// </summary>
public class CommentListResponseDto
{
    public List<CommentResponseDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}

/// <summary>
/// DTO for comment query parameters
/// </summary>
public class CommentQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? LeadId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? ActivityId { get; set; }
    public Guid? UserId { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDirection { get; set; } = "desc";
}

