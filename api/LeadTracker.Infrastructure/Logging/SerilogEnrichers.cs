using Serilog.Core;
using Serilog.Events;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace LeadTracker.Infrastructure.Logging;

/// <summary>
/// Enricher pour ajouter l'organization ID aux logs
/// </summary>
public class OrganizationIdEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public OrganizationIdEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return;

        // Try to get organization ID from header first
        if (httpContext.Request.Headers.TryGetValue("X-Org-Id", out var orgIdHeader))
        {
            var orgIdProperty = propertyFactory.CreateProperty("org_id", orgIdHeader.ToString());
            logEvent.AddPropertyIfAbsent(orgIdProperty);
            return;
        }

        // Try to get organization ID from JWT claims
        var user = httpContext.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var orgIdClaim = user.FindFirst("org_id") ?? user.FindFirst("organization_id");
            if (orgIdClaim != null)
            {
                var orgIdProperty = propertyFactory.CreateProperty("org_id", orgIdClaim.Value);
                logEvent.AddPropertyIfAbsent(orgIdProperty);
            }
        }
    }
}

/// <summary>
/// Enricher pour ajouter l'user ID aux logs
/// </summary>
public class UserIdEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserIdEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return;

        var user = httpContext.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = user.FindFirst("user_id") ?? user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null)
            {
                var userIdProperty = propertyFactory.CreateProperty("user_id", userIdClaim.Value);
                logEvent.AddPropertyIfAbsent(userIdProperty);
            }

            var emailClaim = user.FindFirst(ClaimTypes.Email);
            if (emailClaim != null)
            {
                var emailProperty = propertyFactory.CreateProperty("user_email", emailClaim.Value);
                logEvent.AddPropertyIfAbsent(emailProperty);
            }
        }
    }
}

/// <summary>
/// Enricher pour ajouter des informations de requête aux logs
/// </summary>
public class RequestInfoEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RequestInfoEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return;

        // Add request path
        var pathProperty = propertyFactory.CreateProperty("request_path", httpContext.Request.Path);
        logEvent.AddPropertyIfAbsent(pathProperty);

        // Add request method
        var methodProperty = propertyFactory.CreateProperty("request_method", httpContext.Request.Method);
        logEvent.AddPropertyIfAbsent(methodProperty);

        // Add request ID (correlation ID)
        if (httpContext.Request.Headers.TryGetValue("X-Request-ID", out var requestId))
        {
            var requestIdProperty = propertyFactory.CreateProperty("request_id", requestId.ToString());
            logEvent.AddPropertyIfAbsent(requestIdProperty);
        }
        else
        {
            var requestIdProperty = propertyFactory.CreateProperty("request_id", httpContext.TraceIdentifier);
            logEvent.AddPropertyIfAbsent(requestIdProperty);
        }

        // Add user agent
        if (httpContext.Request.Headers.TryGetValue("User-Agent", out var userAgent))
        {
            var userAgentProperty = propertyFactory.CreateProperty("user_agent", userAgent.ToString());
            logEvent.AddPropertyIfAbsent(userAgentProperty);
        }
    }
}

