using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Stage entity - represents pipeline stages for leads
/// </summary>
public class Stage : TenantEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public int Order { get; set; }
    
    [MaxLength(7)]
    public string Color { get; set; } = "#3B82F6"; // Default blue color
    
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Indicates if this stage represents a "won" state
    /// </summary>
    public bool IsWonStage { get; set; } = false;
    
    /// <summary>
    /// Indicates if this stage represents a "lost" state  
    /// </summary>
    public bool IsLostStage { get; set; } = false;
    
    // Navigation properties
    public virtual ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
