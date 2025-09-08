using LeadTracker.Core.Services;
using Microsoft.Extensions.Logging;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service implementation for tenant filtering in EF Core queries
/// </summary>
public class TenantFilterService : ITenantFilterService
{
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<TenantFilterService> _logger;

    public TenantFilterService(ITenantContext tenantContext, ILogger<TenantFilterService> logger)
    {
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets the current organization ID for filtering tenant data
    /// </summary>
    /// <returns>Organization ID if tenant is resolved, null otherwise</returns>
    public Guid? GetCurrentOrganizationId()
    {
        var orgId = _tenantContext.OrganizationId;
        
        if (orgId.HasValue)
        {
            _logger.LogInformation("Tenant filter applied for organization {OrganizationId}", orgId.Value);
        }
        else
        {
            _logger.LogWarning("No tenant context available - all tenant data will be filtered out");
        }
        
        return orgId;
    }

    /// <summary>
    /// Checks if tenant context is available
    /// </summary>
    /// <returns>True if tenant is resolved, false otherwise</returns>
    public bool HasTenantContext()
    {
        return _tenantContext.OrganizationId.HasValue;
    }

    /// <summary>
    /// Gets the current organization name for logging/debugging purposes
    /// </summary>
    /// <returns>Organization name if available, null otherwise</returns>
    public string? GetCurrentOrganizationName()
    {
        return _tenantContext.OrganizationName;
    }
}
