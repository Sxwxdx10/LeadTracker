using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for comment management
/// </summary>
public interface ICommentService
{
    /// <summary>
    /// Get comments with pagination and filtering
    /// </summary>
    Task<CommentListResponseDto> GetCommentsAsync(CommentQueryDto query);
    
    /// <summary>
    /// Get a specific comment by ID
    /// </summary>
    Task<CommentResponseDto?> GetCommentByIdAsync(Guid id);
    
    /// <summary>
    /// Create a new comment
    /// </summary>
    Task<CommentResponseDto> CreateCommentAsync(CreateCommentDto createDto);
    
    /// <summary>
    /// Update an existing comment
    /// </summary>
    Task<CommentResponseDto?> UpdateCommentAsync(Guid id, UpdateCommentDto updateDto);
    
    /// <summary>
    /// Delete a comment
    /// </summary>
    Task<bool> DeleteCommentAsync(Guid id);
    
    /// <summary>
    /// Get comments for a specific lead
    /// </summary>
    Task<List<CommentResponseDto>> GetCommentsByLeadIdAsync(Guid leadId);
    
    /// <summary>
    /// Get comments for a specific task
    /// </summary>
    Task<List<CommentResponseDto>> GetCommentsByTaskIdAsync(Guid taskId);
    
    /// <summary>
    /// Get comments for a specific activity
    /// </summary>
    Task<List<CommentResponseDto>> GetCommentsByActivityIdAsync(Guid activityId);
}

