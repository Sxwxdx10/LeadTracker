using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Activity entity - represents activities related to leads (calls, emails, meetings, etc.)
/// </summary>
public class Activity : TenantEntity
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "Note"; // Call, Email, Meeting, Note, Task
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Planned"; // Planned, Completed, Cancelled
    
    public DateTime? ScheduledAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    /// <summary>
    /// Duration in minutes (for completed activities)
    /// </summary>
    public int? DurationMinutes { get; set; }
    
    [MaxLength(500)]
    public string? Location { get; set; }
    
    [MaxLength(2000)]
    public string? Outcome { get; set; }
    
    // Foreign Keys
    public Guid? LeadId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    // Navigation properties
    public virtual Lead? Lead { get; set; }
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    
    // Computed properties
    public bool IsCompleted => Status == "Completed";
    public bool IsOverdue => Status == "Planned" && ScheduledAt.HasValue && ScheduledAt < DateTime.UtcNow;
}

