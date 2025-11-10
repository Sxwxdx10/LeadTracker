using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.Infrastructure.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, LeadTrackerDbContext dbContext)
    {
        try
        {
            // Skip tenant resolution for certain endpoints that don't need it
            var path = context.Request.Path.Value?.ToLowerInvariant();
            if (path != null && (path.StartsWith("/health") || 
                                path.StartsWith("/swagger") || 
                                path.StartsWith("/api/health") ||
                                path.StartsWith("/api/auth")))  // Skip auth endpoints
            {
                await _next(context);
                return;
            }

            Guid? orgId = null;
            
            // First, try to resolve tenant from X-Org-Id header
            var orgIdHeader = context.Request.Headers["X-Org-Id"].FirstOrDefault();
            if (Guid.TryParse(orgIdHeader, out var headerOrgId))
            {
                orgId = headerOrgId;
                _logger.LogInformation("Using organization ID from X-Org-Id header: {OrgId}", orgId);
            }
            // If no header, try to extract from JWT token if authenticated
            else if (context.User.Identity?.IsAuthenticated == true)
            {
                _logger.LogInformation("User is authenticated, looking for org_id claim");
                _logger.LogInformation("Available claims: {Claims}", 
                    string.Join(", ", context.User.Claims.Select(c => $"{c.Type}={c.Value}")));
                
                var orgIdClaim = context.User.FindFirst("org_id");
                if (orgIdClaim != null && Guid.TryParse(orgIdClaim.Value, out var jwtOrgId))
                {
                    orgId = jwtOrgId;
                    _logger.LogInformation("Using organization ID from JWT token: {OrgId}", orgId);
                }
                else
                {
                    _logger.LogWarning("org_id claim not found or invalid in JWT token");
                }
            }
            
            if (orgId.HasValue)
            {
                _logger.LogInformation("Looking for organization with ID: {OrgId}", orgId);
                
                   // Debug: Show database connection info
                   try
                   {
                       var connectionString = dbContext.Database.GetConnectionString();
                       _logger.LogInformation("Using database connection: {ConnectionString}", connectionString);
                   }
                   catch (InvalidOperationException)
                   {
                       _logger.LogInformation("Using InMemory database");
                   }
                
                // Debug: List all organizations in database
                var allOrgs = await dbContext.Organizations.ToListAsync();
                _logger.LogInformation("Found {Count} organizations in database: {OrgIds}", 
                    allOrgs.Count, 
                    string.Join(", ", allOrgs.Select(o => $"{o.Name}({o.Id})")));
                
                // Verify organization exists and is active
                var organization = allOrgs.FirstOrDefault(o => o.Id == orgId && o.IsActive);
                
                if (organization != null)
                {
                    if (tenantContext is TenantContext mutableContext)
                    {
                        mutableContext.OrganizationId = orgId.Value;
                        mutableContext.OrganizationName = organization.Name;
                    }
                    
                    _logger.LogInformation("Resolved organization {OrgName} (ID: {OrgId})", organization.Name, orgId);
                }
                else
                {
                    _logger.LogWarning("Invalid or inactive organization ID: {OrgId}", orgId);
                }
            }
            else if (!string.IsNullOrEmpty(orgIdHeader))
            {
                _logger.LogWarning("Invalid organization ID format: {OrgId}", orgIdHeader);
            }
            else
            {
                _logger.LogWarning("No organization ID found in X-Org-Id header or JWT token");
            }

            // Resolve user from JWT token if authenticated
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst("user_id");
                var userEmailClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email);
                
                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var businessUserId))
                {
                    // The user_id claim now directly contains the BusinessUser.Id (DomainUserId)
                    // Verify that the BusinessUser exists
                    var businessUser = await dbContext.BusinessUsers
                        .Where(bu => bu.Id == businessUserId && bu.IsActive)
                        .Select(bu => new { bu.Id, bu.Email })
                        .FirstOrDefaultAsync();
                        
                    if (businessUser != null)
                    {
                        if (tenantContext is TenantContext mutableContext)
                        {
                            mutableContext.UserId = businessUser.Id; // BusinessUser.Id
                            mutableContext.UserEmail = userEmailClaim?.Value ?? businessUser.Email;
                            _logger.LogInformation("Resolved BusinessUser {BusinessUserId} from JWT token", 
                                businessUser.Id);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("BusinessUser {BusinessUserId} not found or inactive", businessUserId);
                    }
                }
                else
                {
                    _logger.LogWarning("user_id claim not found or invalid in JWT token");
                }
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in TenantResolutionMiddleware");
            await _next(context);
        }
    }
}
