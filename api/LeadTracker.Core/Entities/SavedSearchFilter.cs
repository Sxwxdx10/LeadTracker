using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Saved search filter entity for storing user's favorite search criteria
/// </summary>
public class SavedSearchFilter : TenantEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public string SearchCriteriaJson { get; set; } = string.Empty;

    public bool IsShared { get; set; } = false;

    [Required]
    public Guid CreatedByUserId { get; set; }

    public int UsageCount { get; set; } = 0;

    public DateTime LastUsedAt { get; set; }

    // Navigation properties
    public virtual ApplicationUser CreatedByUser { get; set; } = null!;
}
