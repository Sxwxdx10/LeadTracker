using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Wrapper for file upload to avoid ASP.NET dependencies in Core
/// </summary>
public class FileUploadDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Length { get; set; }
    public Stream Stream { get; set; } = null!;
}

/// <summary>
/// Service interface for attachment management
/// </summary>
public interface IAttachmentService
{
    /// <summary>
    /// Get attachments with pagination and filtering
    /// </summary>
    Task<AttachmentListResponseDto> GetAttachmentsAsync(AttachmentQueryDto query);
    
    /// <summary>
    /// Get a specific attachment by ID
    /// </summary>
    Task<AttachmentResponseDto?> GetAttachmentByIdAsync(Guid id);
    
    /// <summary>
    /// Upload a new attachment
    /// </summary>
    Task<AttachmentResponseDto> UploadAttachmentAsync(FileUploadDto file, CreateAttachmentDto createDto);
    
    /// <summary>
    /// Update attachment metadata
    /// </summary>
    Task<AttachmentResponseDto?> UpdateAttachmentAsync(Guid id, UpdateAttachmentDto updateDto);
    
    /// <summary>
    /// Delete an attachment (soft delete)
    /// </summary>
    Task<bool> DeleteAttachmentAsync(Guid id);
    
    /// <summary>
    /// Get attachments for a specific lead
    /// </summary>
    Task<List<AttachmentResponseDto>> GetAttachmentsByLeadIdAsync(Guid leadId);
    
    /// <summary>
    /// Get attachments for a specific task
    /// </summary>
    Task<List<AttachmentResponseDto>> GetAttachmentsByTaskIdAsync(Guid taskId);
    
    /// <summary>
    /// Get attachments for a specific activity
    /// </summary>
    Task<List<AttachmentResponseDto>> GetAttachmentsByActivityIdAsync(Guid activityId);
    
    /// <summary>
    /// Get attachments for a specific comment
    /// </summary>
    Task<List<AttachmentResponseDto>> GetAttachmentsByCommentIdAsync(Guid commentId);
    
    /// <summary>
    /// Get the file stream for downloading
    /// </summary>
    Task<(Stream stream, string contentType, string fileName)?> GetAttachmentFileAsync(Guid id);
}

