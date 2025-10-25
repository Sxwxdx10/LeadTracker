using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for activity management
/// </summary>
public interface IActivityService
{
    /// <summary>
    /// Get activities with pagination and filtering
    /// </summary>
    Task<ActivityListResponseDto> GetActivitiesAsync(ActivityQueryDto query);
    
    /// <summary>
    /// Get a specific activity by ID
    /// </summary>
    Task<ActivityResponseDto?> GetActivityByIdAsync(Guid id);
    
    /// <summary>
    /// Create a new activity
    /// </summary>
    Task<ActivityResponseDto> CreateActivityAsync(CreateActivityDto createDto);
    
    /// <summary>
    /// Update an existing activity
    /// </summary>
    Task<ActivityResponseDto?> UpdateActivityAsync(Guid id, UpdateActivityDto updateDto);
    
    /// <summary>
    /// Delete an activity
    /// </summary>
    Task<bool> DeleteActivityAsync(Guid id);
    
    /// <summary>
    /// Get activities for a specific lead
    /// </summary>
    Task<List<ActivityResponseDto>> GetActivitiesByLeadIdAsync(Guid leadId);
    
    /// <summary>
    /// Get activities for the current user
    /// </summary>
    Task<List<ActivityResponseDto>> GetMyActivitiesAsync();
    
    /// <summary>
    /// Mark an activity as completed
    /// </summary>
    Task<ActivityResponseDto?> CompleteActivityAsync(Guid id, string? outcome, int? durationMinutes);
}

