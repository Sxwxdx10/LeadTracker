using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Organization entity - represents a tenant in the multi-tenant system
/// </summary>
public class Organization : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Domain { get; set; } = string.Empty; // e.g., "acme-corp"
    
    [MaxLength(10)]
    public string? TimeZone { get; set; } = "UTC";
    
    [MaxLength(5)]
    public string? Currency { get; set; } = "USD";
    
    public bool IsActive { get; set; } = true;
    
    public DateTime? SubscriptionExpiresAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Lead> Leads { get; set; } = new List<Lead>();
    public virtual ICollection<Stage> Stages { get; set; } = new List<Stage>();
}
