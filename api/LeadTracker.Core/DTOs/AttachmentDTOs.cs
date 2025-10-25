using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for creating a new attachment (used with multipart/form-data)
/// </summary>
public class CreateAttachmentDto
{
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public Guid? LeadId { get; set; }
    
    public Guid? TaskId { get; set; }
    
    public Guid? ActivityId { get; set; }
    
    public Guid? CommentId { get; set; }
}

/// <summary>
/// DTO for updating an existing attachment
/// </summary>
public class UpdateAttachmentDto
{
    [MaxLength(500)]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for attachment response
/// </summary>
public class AttachmentResponseDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public string? Description { get; set; }
    public Guid? LeadId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? ActivityId { get; set; }
    public Guid? CommentId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Related data
    public string? UploadedByUserName { get; set; }
    public bool IsImage { get; set; }
    public bool IsDocument { get; set; }
}

/// <summary>
/// DTO for attachment list response with pagination
/// </summary>
public class AttachmentListResponseDto
{
    public List<AttachmentResponseDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}

/// <summary>
/// DTO for attachment query parameters
/// </summary>
public class AttachmentQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? LeadId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? ActivityId { get; set; }
    public Guid? CommentId { get; set; }
    public Guid? UploadedByUserId { get; set; }
    public string? ContentType { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDirection { get; set; } = "desc";
}

