using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Base entity with common properties for all entities
/// </summary>
public abstract class BaseEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public string? CreatedBy { get; set; }
    
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// Base entity for multi-tenant entities
/// </summary>
public abstract class TenantEntity : BaseEntity
{
    [Required]
    public Guid OrganizationId { get; set; }
    
    public virtual Organization Organization { get; set; } = null!;
}
