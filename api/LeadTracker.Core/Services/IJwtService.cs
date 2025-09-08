using LeadTracker.Core.Entities;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for JWT token generation and validation
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Generates a JWT access token for the user
    /// </summary>
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    
    /// <summary>
    /// Generates a refresh token
    /// </summary>
    string GenerateRefreshToken();
    
    /// <summary>
    /// Validates a refresh token
    /// </summary>
    bool ValidateRefreshToken(string refreshToken);
    
    /// <summary>
    /// Gets user ID from JWT token
    /// </summary>
    Guid? GetUserIdFromToken(string token);
    
    /// <summary>
    /// Gets organization ID from JWT token
    /// </summary>
    Guid? GetOrganizationIdFromToken(string token);
    
    /// <summary>
    /// Gets user roles from JWT token
    /// </summary>
    IList<string> GetUserRolesFromToken(string token);
}
