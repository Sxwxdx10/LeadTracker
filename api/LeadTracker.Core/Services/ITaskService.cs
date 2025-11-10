using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for task management
/// </summary>
public interface ITaskService
{
    /// <summary>
    /// Get tasks with pagination and filtering
    /// </summary>
    Task<TaskListResponseDto> GetTasksAsync(TaskQueryDto query);
    
    /// <summary>
    /// Get a specific task by ID
    /// </summary>
    Task<TaskResponseDto?> GetTaskByIdAsync(Guid id);
    
    /// <summary>
    /// Create a new task
    /// </summary>
    Task<TaskResponseDto> CreateTaskAsync(CreateTaskDto createDto);
    
    /// <summary>
    /// Update an existing task
    /// </summary>
    Task<TaskResponseDto?> UpdateTaskAsync(Guid id, UpdateTaskDto updateDto);
    
    /// <summary>
    /// Delete a task
    /// </summary>
    Task<bool> DeleteTaskAsync(Guid id);
    
    /// <summary>
    /// Get tasks for a specific lead
    /// </summary>
    Task<List<TaskResponseDto>> GetTasksByLeadIdAsync(Guid leadId);
    
    /// <summary>
    /// Get tasks for the current user
    /// </summary>
    Task<List<TaskResponseDto>> GetMyTasksAsync();
    
    /// <summary>
    /// Mark a task as completed
    /// </summary>
    Task<TaskResponseDto?> CompleteTaskAsync(Guid id, string? notes, int? durationMinutes);
    
    /// <summary>
    /// Get tasks due today and this week for "My Day" view
    /// </summary>
    Task<MyDayTasksResponseDto> GetMyDayTasksAsync();
    
    /// <summary>
    /// Get upcoming tasks for the next N days
    /// </summary>
    Task<List<TaskResponseDto>> GetUpcomingTasksAsync(int days);
    
    /// <summary>
    /// Validate that a user exists and can be assigned tasks
    /// </summary>
    Task<bool> ValidateTaskAssignmentAsync(Guid userId);
}
