using System.ComponentModel.DataAnnotations;
using LeadTracker.Core.Entities;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// Request to invite a new user to the organization
/// </summary>
public class InviteUserRequest
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

    [MaxLength(500)]
    public string? Message { get; set; }
}

/// <summary>
/// Response after inviting a user
/// </summary>
public class InviteUserResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? InvitationId { get; set; }
}

/// <summary>
/// Request to accept an invitation
/// </summary>
public class AcceptInvitationRequest
{
    [Required]
    public string InvitationToken { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// Request to update user roles
/// </summary>
public class UpdateUserRolesRequest
{
    [Required]
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// Request to update user status (active/inactive)
/// </summary>
public class UpdateUserStatusRequest
{
    [Required]
    public bool IsActive { get; set; }
}

/// <summary>
/// Request to update user information
/// </summary>
public class UpdateUserRequest
{
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(100)]
    public string? JobTitle { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
}

/// <summary>
/// Simple user information for task assignment and basic displays
/// </summary>
public class SimpleUserInfo
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// User information for display in admin interface
/// </summary>
public class UserManagementInfo
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public string OrganizationName { get; set; } = string.Empty;
}

/// <summary>
/// Response for user list in admin interface
/// </summary>
public class UserListResponse
{
    public List<UserManagementInfo> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
