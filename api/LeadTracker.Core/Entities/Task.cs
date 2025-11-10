using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Task entity - represents activities/tasks related to leads
/// </summary>
public class Task : TenantEntity
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "Call"; // Call, Email, Meeting, Follow-up, etc.
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled
    
    [Required]
    public DateTime DueDate { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    [MaxLength(20)]
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    /// <summary>
    /// Duration in minutes (for completed tasks)
    /// </summary>
    public int? DurationMinutes { get; set; }
    
    // Reminder configuration
    public bool HasReminder { get; set; } = true;
    
    /// <summary>
    /// Exact time when reminder should be sent
    /// </summary>
    public DateTime? ReminderAt { get; set; }
    
    /// <summary>
    /// Number of minutes before DueDate to send reminder (default: 60 minutes)
    /// </summary>
    public int? ReminderMinutesBefore { get; set; } = 60;
    
    /// <summary>
    /// Whether reminder has been sent for this task
    /// </summary>
    public bool ReminderSent { get; set; } = false;
    
    // Recurrence configuration
    public bool IsRecurring { get; set; } = false;
    
    /// <summary>
    /// Recurrence pattern: "Daily", "Weekly", "Monthly", "Custom"
    /// </summary>
    [MaxLength(20)]
    public string? RecurrencePattern { get; set; }
    
    /// <summary>
    /// Interval for recurrence (e.g., every X days/weeks/months)
    /// </summary>
    public int? RecurrenceInterval { get; set; }
    
    /// <summary>
    /// When to stop creating recurring instances
    /// </summary>
    public DateTime? RecurrenceEndDate { get; set; }
    
    /// <summary>
    /// Reference to parent task if this is a recurring instance
    /// </summary>
    public Guid? ParentTaskId { get; set; }
    
    // Foreign Keys
    public Guid? LeadId { get; set; }
    
    [Required]
    public Guid AssignedUserId { get; set; }
    
    // Navigation properties
    public virtual Lead? Lead { get; set; }
    public virtual User AssignedUser { get; set; } = null!;
    public virtual Task? ParentTask { get; set; }
    public virtual ICollection<Task> RecurringInstances { get; set; } = new List<Task>();
    
    // Computed properties
    public bool IsOverdue => Status != "Completed" && Status != "Cancelled" && DueDate < DateTime.UtcNow;
    public bool IsCompleted => Status == "Completed";
    public bool IsToday
    {
        get
        {
            var now = DateTime.UtcNow;
            var todayStart = now.Date;
            var todayEnd = todayStart.AddDays(1);
            return DueDate >= todayStart && DueDate < todayEnd;
        }
    }
}
