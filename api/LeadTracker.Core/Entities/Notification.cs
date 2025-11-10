using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// In-app notification entity for users
/// </summary>
public class Notification : TenantEntity
{
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // "TaskReminder", "TaskOverdue", "TaskAssigned", "LeadUpdated", etc.
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Related task ID (if notification is about a task)
    /// </summary>
    public Guid? RelatedTaskId { get; set; }
    
    /// <summary>
    /// Related lead ID (if notification is about a lead)
    /// </summary>
    public Guid? RelatedLeadId { get; set; }
    
    /// <summary>
    /// Whether the notification has been read by the user
    /// </summary>
    public bool IsRead { get; set; } = false;
    
    /// <summary>
    /// When the notification was marked as read
    /// </summary>
    public DateTime? ReadAt { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Task? RelatedTask { get; set; }
    public virtual Lead? RelatedLead { get; set; }
}

