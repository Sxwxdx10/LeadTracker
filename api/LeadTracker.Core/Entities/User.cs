using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// User entity - extends the Identity ApplicationUser concept
/// </summary>
public class User : TenantEntity
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
    
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime? LastLoginAt { get; set; }
    
    /// <summary>
    /// Reference to AspNetCore Identity User ID
    /// </summary>
    public Guid? IdentityUserId { get; set; }
    
    // Computed property
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    // Navigation properties
    public virtual ICollection<Lead> AssignedLeads { get; set; } = new List<Lead>();
    public virtual ICollection<Task> AssignedTasks { get; set; } = new List<Task>();
}
