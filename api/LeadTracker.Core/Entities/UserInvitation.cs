using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// User invitation entity for tracking invitations
/// </summary>
public class UserInvitation : TenantEntity
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? JobTitle { get; set; }

    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = "User";

    [Required]
    [MaxLength(500)]
    public string InvitationToken { get; set; } = string.Empty;

    [Required]
    public Guid InvitedByUserId { get; set; }

    [Required]
    public DateTime ExpiresAt { get; set; }

    public bool IsAccepted { get; set; } = false;

    public DateTime? AcceptedAt { get; set; }

    public Guid? AcceptedUserId { get; set; }

    [MaxLength(1000)]
    public string? Message { get; set; }

    // Navigation properties
    public virtual ApplicationUser InvitedByUser { get; set; } = null!;
    public virtual ApplicationUser? AcceptedUser { get; set; }

    // Computed properties
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    public string FullName => $"{FirstName} {LastName}".Trim();
}
