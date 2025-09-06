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
    
    // Foreign Keys
    public Guid? LeadId { get; set; }
    
    public Guid? AssignedUserId { get; set; }
    
    // Navigation properties
    public virtual Lead? Lead { get; set; }
    public virtual User? AssignedUser { get; set; }
    
    // Computed properties
    public bool IsOverdue => Status != "Completed" && DueDate < DateTime.UtcNow;
    public bool IsCompleted => Status == "Completed";
    public bool IsToday => DueDate.Date == DateTime.UtcNow.Date;
}
