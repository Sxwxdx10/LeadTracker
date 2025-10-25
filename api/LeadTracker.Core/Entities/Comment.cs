using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Comment entity - represents comments on leads, tasks, or activities
/// </summary>
public class Comment : TenantEntity
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public DateTime? EditedAt { get; set; }
    
    // Foreign Keys - can be linked to different entities
    public Guid? LeadId { get; set; }
    
    public Guid? TaskId { get; set; }
    
    public Guid? ActivityId { get; set; }
    
    /// <summary>
    /// Parent comment ID for threaded comments
    /// </summary>
    public Guid? ParentCommentId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    // Navigation properties
    public virtual Lead? Lead { get; set; }
    public virtual Task? Task { get; set; }
    public virtual Activity? Activity { get; set; }
    public virtual Comment? ParentComment { get; set; }
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    
    // Computed properties
    public bool IsEdited => EditedAt.HasValue;
    public bool IsReply => ParentCommentId.HasValue;
}

