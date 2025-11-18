using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Lead entity - represents a potential customer/opportunity
/// </summary>
public class Lead : TenantEntity
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    [MaxLength(255)]
    [EmailAddress]
    public string? Email { get; set; }
    
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
    
    [MaxLength(255)]
    [Url]
    public string? Website { get; set; }
    
    [MaxLength(200)]
    public string? Company { get; set; }
    
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? EstimatedValue { get; set; }
    
    /// <summary>
    /// Probability of closing (0-100)
    /// </summary>
    [Range(0, 100)]
    public int Probability { get; set; } = 50;
    
    public DateTime? ExpectedCloseDate { get; set; }
    
    [MaxLength(2000)]
    public string? Notes { get; set; }
    
    [MaxLength(50)]
    public string? Source { get; set; } // e.g., "Website", "Referral", "Cold Call"
    
    [MaxLength(20)]
    public string Status { get; set; } = "Open"; // Open, Won, Lost
    
    public bool IsActive { get; set; } = true;
    
    public DateTime? LastContactedAt { get; set; }
    
    // Foreign Keys
    [Required]
    public Guid StageId { get; set; }
    
    public Guid? AssignedUserId { get; set; }
    
    // Navigation properties
    public virtual Stage Stage { get; set; } = null!;
    public virtual User? AssignedUser { get; set; }
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
    
    // Computed properties
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsQualified => !string.IsNullOrEmpty(Email) && !string.IsNullOrEmpty(PhoneNumber);
}
