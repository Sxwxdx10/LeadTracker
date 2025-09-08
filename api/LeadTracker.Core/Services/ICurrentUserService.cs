using System.Security.Claims;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for getting current user information
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Gets the current user ID
    /// </summary>
    Guid? GetCurrentUserId();
    
    /// <summary>
    /// Gets the current user email
    /// </summary>
    string? GetCurrentUserEmail();
    
    /// <summary>
    /// Gets the current organization ID
    /// </summary>
    Guid? GetCurrentOrganizationId();
    
    /// <summary>
    /// Gets the current user roles
    /// </summary>
    IList<string> GetCurrentUserRoles();
    
    /// <summary>
    /// Gets the current user claims
    /// </summary>
    ClaimsPrincipal? GetCurrentUser();
}
