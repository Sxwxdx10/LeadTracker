using LeadTracker.Core.Models;
using LeadTracker.Core.Entities;
using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Authentication service interface
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user and organization
    /// </summary>
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    
    /// <summary>
    /// Registers a new user via invitation token
    /// </summary>
    Task<AuthResponse> RegisterWithInvitationAsync(AcceptInvitationRequest request);
    
    /// <summary>
    /// Authenticates a user and returns tokens
    /// </summary>
    Task<AuthResponse> LoginAsync(LoginRequest request);
    
    /// <summary>
    /// Refreshes access token using refresh token
    /// </summary>
    Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request);
    
    /// <summary>
    /// Initiates password reset process
    /// </summary>
    Task<bool> InitiatePasswordResetAsync(ResetPasswordRequest request);
    
    /// <summary>
    /// Confirms password reset with token
    /// </summary>
    Task<bool> ConfirmPasswordResetAsync(ConfirmResetPasswordRequest request);
    
    /// <summary>
    /// Logs out user by invalidating refresh token
    /// </summary>
    Task<bool> LogoutAsync(string refreshToken);
    
    /// <summary>
    /// Validates user credentials
    /// </summary>
    Task<ApplicationUser?> ValidateUserAsync(string email, string password, string organizationDomain);
}
