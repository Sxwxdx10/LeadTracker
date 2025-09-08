using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace LeadTracker.Infrastructure.Middleware;

/// <summary>
/// Middleware for request correlation tracking
/// </summary>
public class RequestCorrelationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestCorrelationMiddleware> _logger;

    public RequestCorrelationMiddleware(RequestDelegate next, ILogger<RequestCorrelationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Generate or extract correlation ID
            var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() 
                ?? Guid.NewGuid().ToString();

            // Add correlation ID to response headers
            context.Response.Headers["X-Correlation-ID"] = correlationId;

            // Set up activity for distributed tracing
            using var activity = ActivitySource.StartActivity("Request");
            activity?.SetTag("correlation.id", correlationId);
            activity?.SetTag("http.method", context.Request.Method);
            activity?.SetTag("http.url", context.Request.Path);

            _logger.LogDebug("Processing request with correlation ID: {CorrelationId}", correlationId);

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in RequestCorrelationMiddleware");
            throw;
        }
    }

    private static readonly ActivitySource ActivitySource = new("LeadTracker.Api");
}
