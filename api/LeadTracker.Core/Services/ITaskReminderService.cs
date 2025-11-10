namespace LeadTracker.Core.Services;

/// <summary>
/// Service for managing task reminders and recurring tasks
/// </summary>
public interface ITaskReminderService
{
    /// <summary>
    /// Schedule a reminder for a task using Hangfire
    /// </summary>
    Task ScheduleTaskReminderAsync(Guid taskId);
    
    /// <summary>
    /// Send a task reminder (email + in-app notification)
    /// </summary>
    Task SendTaskReminderAsync(Guid taskId);
    
    /// <summary>
    /// Check for overdue tasks and send notifications
    /// This is called by a recurring Hangfire job
    /// </summary>
    Task CheckOverdueTasksAsync();
    
    /// <summary>
    /// Process recurring tasks and create new instances
    /// This is called by a recurring Hangfire job (daily)
    /// </summary>
    Task ProcessRecurringTasksAsync();
    
    /// <summary>
    /// Cancel a scheduled reminder for a task
    /// </summary>
    Task CancelTaskReminderAsync(Guid taskId);
}

