using LeadTracker.Core.Models;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for sending emails
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Send user invitation email
    /// </summary>
    /// <param name="invitation">Invitation details</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendUserInvitationAsync(UserInvitationEmail invitation);

    /// <summary>
    /// Send password reset email
    /// </summary>
    /// <param name="resetRequest">Password reset details</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendPasswordResetEmailAsync(PasswordResetEmail resetRequest);

    /// <summary>
    /// Send email verification email
    /// </summary>
    /// <param name="verification">Email verification details</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendEmailVerificationAsync(EmailVerificationEmail verification);
}

/// <summary>
/// User invitation email model
/// </summary>
public class UserInvitationEmail
{
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string InviterName { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string InvitationToken { get; set; } = string.Empty;
    public string InvitationUrl { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// Password reset email model
/// </summary>
public class PasswordResetEmail
{
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string ResetToken { get; set; } = string.Empty;
    public string ResetUrl { get; set; } = string.Empty;
}

/// <summary>
/// Email verification email model
/// </summary>
public class EmailVerificationEmail
{
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string VerificationToken { get; set; } = string.Empty;
    public string VerificationUrl { get; set; } = string.Empty;
}
