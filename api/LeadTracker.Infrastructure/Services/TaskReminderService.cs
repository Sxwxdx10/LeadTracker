using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using Hangfire;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for task reminders and recurring tasks using Hangfire
/// </summary>
public class TaskReminderService : ITaskReminderService
{
    private readonly LeadTrackerDbContext _context;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TaskReminderService> _logger;

    public TaskReminderService(
        LeadTrackerDbContext context,
        IEmailService emailService,
        INotificationService notificationService,
        ILogger<TaskReminderService> logger)
    {
        _context = context;
        _emailService = emailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task ScheduleTaskReminderAsync(Guid taskId)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedUser)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            _logger.LogWarning("Task {TaskId} not found for reminder scheduling", taskId);
            return;
        }

        if (!task.HasReminder)
        {
            _logger.LogInformation("Task {TaskId} does not have reminder enabled", taskId);
            return;
        }

        // Calculate reminder time if not explicitly set
        if (!task.ReminderAt.HasValue && task.ReminderMinutesBefore.HasValue)
        {
            task.ReminderAt = task.DueDate.AddMinutes(-task.ReminderMinutesBefore.Value);
            await _context.SaveChangesAsync();
        }

        if (task.ReminderAt.HasValue && task.ReminderAt.Value > DateTime.UtcNow && !task.ReminderSent)
        {
            // Schedule the reminder using Hangfire
            var jobId = BackgroundJob.Schedule(
                () => SendTaskReminderAsync(taskId),
                task.ReminderAt.Value
            );

            _logger.LogInformation("Scheduled reminder for task {TaskId} at {ReminderAt} (Job: {JobId})", 
                taskId, task.ReminderAt.Value, jobId);
        }
        else if (task.ReminderAt.HasValue && task.ReminderAt.Value <= DateTime.UtcNow && !task.ReminderSent)
        {
            // Reminder time has passed, send immediately
            BackgroundJob.Enqueue(() => SendTaskReminderAsync(taskId));
            _logger.LogInformation("Enqueued immediate reminder for task {TaskId}", taskId);
        }
    }

    public async Task SendTaskReminderAsync(Guid taskId)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedUser)
            .Include(t => t.Lead)
            .Include(t => t.Organization)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            _logger.LogWarning("Task {TaskId} not found for reminder", taskId);
            return;
        }

        if (task.ReminderSent)
        {
            _logger.LogInformation("Reminder already sent for task {TaskId}", taskId);
            return;
        }

        if (task.Status == "Completed" || task.Status == "Cancelled")
        {
            _logger.LogInformation("Task {TaskId} is {Status}, skipping reminder", taskId, task.Status);
            return;
        }

        // Send in-app notification
        try
        {
            var notificationDto = new CreateNotificationDto
            {
                UserId = task.AssignedUserId,
                Type = "TaskReminder",
                Title = $"Rappel: {task.Title}",
                Message = $"Votre tâche '{task.Title}' est due le {task.DueDate:dd/MM/yyyy à HH:mm}",
                RelatedTaskId = task.Id,
                RelatedLeadId = task.LeadId
            };

            await _notificationService.CreateNotificationAsync(notificationDto);
            _logger.LogInformation("Created in-app notification for task {TaskId}", taskId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create in-app notification for task {TaskId}", taskId);
        }

        // Send email reminder
        try
        {
            var emailReminder = new TaskReminderEmail
            {
                ToEmail = task.AssignedUser.Email,
                ToName = task.AssignedUser.FullName,
                TaskTitle = task.Title,
                TaskDescription = task.Description ?? "",
                TaskDueDate = task.DueDate,
                TaskPriority = task.Priority,
                TaskType = task.Type,
                LeadTitle = task.Lead?.Title,
                OrganizationName = task.Organization.Name,
                TaskUrl = $"/tasks/{task.Id}" // This would be the full URL in production
            };

            await _emailService.SendTaskReminderEmailAsync(emailReminder);
            _logger.LogInformation("Sent email reminder for task {TaskId} to {Email}", taskId, task.AssignedUser.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email reminder for task {TaskId}", taskId);
        }

        // Mark reminder as sent
        task.ReminderSent = true;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Task reminder sent successfully for task {TaskId}", taskId);
    }

    public async Task CheckOverdueTasksAsync()
    {
        _logger.LogInformation("Starting overdue tasks check");

        var now = DateTime.UtcNow;
        
        // Find tasks that are overdue and not completed/cancelled
        var overdueTasks = await _context.Tasks
            .Include(t => t.AssignedUser)
            .Include(t => t.Lead)
            .Where(t => t.DueDate < now 
                && t.Status != "Completed" 
                && t.Status != "Cancelled")
            .ToListAsync();

        _logger.LogInformation("Found {Count} overdue tasks", overdueTasks.Count);

        foreach (var task in overdueTasks)
        {
            try
            {
                // Check if we've already sent an overdue notification recently (within last 24 hours)
                var recentNotification = await _context.Notifications
                    .Where(n => n.RelatedTaskId == task.Id 
                        && n.Type == "TaskOverdue"
                        && n.CreatedAt > now.AddHours(-24))
                    .FirstOrDefaultAsync();

                if (recentNotification == null)
                {
                    // Send overdue notification
                    var notificationDto = new CreateNotificationDto
                    {
                        UserId = task.AssignedUserId,
                        Type = "TaskOverdue",
                        Title = $"Tâche en retard: {task.Title}",
                        Message = $"Votre tâche '{task.Title}' était due le {task.DueDate:dd/MM/yyyy à HH:mm}. Veuillez la compléter dès que possible.",
                        RelatedTaskId = task.Id,
                        RelatedLeadId = task.LeadId
                    };

                    await _notificationService.CreateNotificationAsync(notificationDto);
                    _logger.LogInformation("Created overdue notification for task {TaskId}", task.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process overdue task {TaskId}", task.Id);
            }
        }

        _logger.LogInformation("Completed overdue tasks check");
    }

    public async Task ProcessRecurringTasksAsync()
    {
        _logger.LogInformation("Starting recurring tasks processing");

        var now = DateTime.UtcNow;
        
        // Find recurring tasks that need new instances
        var recurringTasks = await _context.Tasks
            .Where(t => t.IsRecurring 
                && !t.ParentTaskId.HasValue  // Only parent tasks, not instances
                && (t.RecurrenceEndDate == null || t.RecurrenceEndDate > now))
            .ToListAsync();

        _logger.LogInformation("Found {Count} recurring tasks to process", recurringTasks.Count);

        foreach (var task in recurringTasks)
        {
            try
            {
                // Check if we need to create a new instance
                var lastInstance = await _context.Tasks
                    .Where(t => t.ParentTaskId == task.Id)
                    .OrderByDescending(t => t.DueDate)
                    .FirstOrDefaultAsync();

                DateTime nextDueDate;
                if (lastInstance != null)
                {
                    nextDueDate = CalculateNextDueDate(lastInstance.DueDate, task.RecurrencePattern, task.RecurrenceInterval ?? 1);
                }
                else
                {
                    nextDueDate = CalculateNextDueDate(task.DueDate, task.RecurrencePattern, task.RecurrenceInterval ?? 1);
                }

                // Only create instance if next due date is within the next week and not past end date
                if (nextDueDate <= now.AddDays(7) && (task.RecurrenceEndDate == null || nextDueDate <= task.RecurrenceEndDate))
                {
                    // Check if instance already exists
                    var existingInstance = await _context.Tasks
                        .FirstOrDefaultAsync(t => t.ParentTaskId == task.Id && t.DueDate.Date == nextDueDate.Date);

                    if (existingInstance == null)
                    {
                        // Create new instance
                        var newInstance = new Core.Entities.Task
                        {
                            Id = Guid.NewGuid(),
                            Title = task.Title,
                            Description = task.Description,
                            Type = task.Type,
                            Status = "Pending",
                            DueDate = nextDueDate,
                            Priority = task.Priority,
                            Notes = task.Notes,
                            LeadId = task.LeadId,
                            AssignedUserId = task.AssignedUserId,
                            OrganizationId = task.OrganizationId,
                            HasReminder = task.HasReminder,
                            ReminderMinutesBefore = task.ReminderMinutesBefore,
                            ParentTaskId = task.Id,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        // Calculate reminder time for new instance
                        if (newInstance.HasReminder && newInstance.ReminderMinutesBefore.HasValue)
                        {
                            newInstance.ReminderAt = newInstance.DueDate.AddMinutes(-newInstance.ReminderMinutesBefore.Value);
                        }

                        _context.Tasks.Add(newInstance);
                        await _context.SaveChangesAsync();

                        // Schedule reminder for new instance
                        await ScheduleTaskReminderAsync(newInstance.Id);

                        // Create notification for assigned user
                        var notificationDto = new CreateNotificationDto
                        {
                            UserId = newInstance.AssignedUserId,
                            Type = "TaskAssigned",
                            Title = $"Nouvelle tâche récurrente: {newInstance.Title}",
                            Message = $"Une nouvelle instance de votre tâche récurrente '{newInstance.Title}' a été créée. Due le {newInstance.DueDate:dd/MM/yyyy à HH:mm}.",
                            RelatedTaskId = newInstance.Id,
                            RelatedLeadId = newInstance.LeadId
                        };

                        await _notificationService.CreateNotificationAsync(notificationDto);

                        _logger.LogInformation("Created recurring task instance {InstanceId} from parent {ParentId} with due date {DueDate}", 
                            newInstance.Id, task.Id, nextDueDate);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process recurring task {TaskId}", task.Id);
            }
        }

        _logger.LogInformation("Completed recurring tasks processing");
    }

    public async Task CancelTaskReminderAsync(Guid taskId)
    {
        _logger.LogInformation("Cancelling reminder for task {TaskId}", taskId);
        
        // Note: In a full implementation, you would need to track job IDs
        // and use BackgroundJob.Delete(jobId) to cancel scheduled jobs
        // For now, we just mark the reminder as sent to prevent it from being sent
        
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task != null)
        {
            task.HasReminder = false;
            task.ReminderSent = true;
            await _context.SaveChangesAsync();
        }
    }

    private DateTime CalculateNextDueDate(DateTime currentDueDate, string? pattern, int interval)
    {
        return pattern switch
        {
            "Daily" => currentDueDate.AddDays(interval),
            "Weekly" => currentDueDate.AddDays(7 * interval),
            "Monthly" => currentDueDate.AddMonths(interval),
            _ => currentDueDate.AddDays(interval) // Default to daily
        };
    }
}

