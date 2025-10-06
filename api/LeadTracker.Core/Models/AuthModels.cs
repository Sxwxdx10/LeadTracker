using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Models;

/// <summary>
/// Request model for user registration
/// </summary>
public class RegisterRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string? OrganizationDescription { get; set; }
    public string? OrganizationDomain { get; set; }
}

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string OrganizationDomain { get; set; } = string.Empty;
    
    public bool RememberMe { get; set; } = false;
}

/// <summary>
/// Request model for password reset
/// </summary>
public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string OrganizationDomain { get; set; } = string.Empty;
}

/// <summary>
/// Request model for password reset confirmation
/// </summary>
public class ConfirmResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Token { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
    
    [Required]
    [Compare(nameof(NewPassword))]
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// Response model for authentication
/// </summary>
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfo User { get; set; } = new();
    public OrganizationInfo Organization { get; set; } = new();
}

/// <summary>
/// User information in auth response
/// </summary>
public class UserInfo
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// Organization information in auth response
/// </summary>
public class OrganizationInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string? TimeZone { get; set; }
    public string? Currency { get; set; }
}

/// <summary>
/// Request model for token refresh
/// </summary>
public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>
/// Response model for token refresh
/// </summary>
public class RefreshTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
