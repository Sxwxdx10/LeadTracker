using LeadTracker.Api.Services;

namespace LeadTracker.Api.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        // Resolve tenant from X-Org-Id header
        var orgIdHeader = context.Request.Headers["X-Org-Id"].FirstOrDefault();
        if (Guid.TryParse(orgIdHeader, out var orgId))
        {
            if (tenantContext is TenantContext mutableContext)
            {
                mutableContext.OrganizationId = orgId;
            }
        }

        await _next(context);
    }
}
