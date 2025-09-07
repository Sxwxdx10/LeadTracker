using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Custom ApplicationUser that extends IdentityUser for multi-tenant support
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime? LastLoginAt { get; set; }
    
    /// <summary>
    /// Organization ID for multi-tenant support
    /// </summary>
    [Required]
    public Guid OrganizationId { get; set; }
    
    /// <summary>
    /// Reference to the User entity in our domain model
    /// </summary>
    public Guid? DomainUserId { get; set; }
    
    /// <summary>
    /// When the user was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When the user was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Computed property
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    // Navigation properties
    public virtual Organization Organization { get; set; } = null!;
    public virtual User? DomainUser { get; set; }
}
