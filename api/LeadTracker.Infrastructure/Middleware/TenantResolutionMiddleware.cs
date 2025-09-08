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
            // Resolve tenant from X-Org-Id header
            var orgIdHeader = context.Request.Headers["X-Org-Id"].FirstOrDefault();
            if (Guid.TryParse(orgIdHeader, out var orgId))
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
                        mutableContext.OrganizationId = orgId;
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

            // Resolve user from JWT token if authenticated
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst("user_id");
                var userEmailClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email);
                
                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    if (tenantContext is TenantContext mutableContext)
                    {
                        mutableContext.UserId = userId;
                        mutableContext.UserEmail = userEmailClaim?.Value;
                    }
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
