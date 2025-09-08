namespace LeadTracker.Core.Services;

/// <summary>
/// Service for providing tenant filtering capabilities in EF Core queries
/// </summary>
public interface ITenantFilterService
{
    /// <summary>
    /// Gets the current organization ID for filtering tenant data
    /// </summary>
    /// <returns>Organization ID if tenant is resolved, null otherwise</returns>
    Guid? GetCurrentOrganizationId();
    
    /// <summary>
    /// Checks if tenant context is available
    /// </summary>
    /// <returns>True if tenant is resolved, false otherwise</returns>
    bool HasTenantContext();
    
    /// <summary>
    /// Gets the current organization name for logging/debugging purposes
    /// </summary>
    /// <returns>Organization name if available, null otherwise</returns>
    string? GetCurrentOrganizationName();
}
