using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Serilog;
using Serilog.Context;
using System.Diagnostics;
using LeadTracker.Infrastructure.Services;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Middleware;

/// <summary>
/// Middleware pour ajouter des informations de corrélation aux logs
/// </summary>
public class LoggingCorrelationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger _logger;

    public LoggingCorrelationMiddleware(RequestDelegate next, ILogger logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Generate correlation ID if not present
        var correlationId = context.Request.Headers["X-Request-ID"].FirstOrDefault() 
                          ?? context.TraceIdentifier 
                          ?? Guid.NewGuid().ToString();

        // Add correlation ID to response headers
        context.Response.Headers["X-Request-ID"] = correlationId;

        // Add correlation ID to log context
        using (LogContext.PushProperty("correlation_id", correlationId))
        using (LogContext.PushProperty("request_start_time", DateTime.UtcNow))
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                _logger.Information("Request started: {Method} {Path} from {RemoteIpAddress}", 
                    context.Request.Method, 
                    context.Request.Path, 
                    context.Connection.RemoteIpAddress);

                await _next(context);

                stopwatch.Stop();
                
                // Record performance metrics
                var orgId = context.Request.Headers["X-Org-Id"].FirstOrDefault();
                var userId = context.User?.FindFirst("user_id")?.Value;
                MonitoringService.RecordPerformanceMetric(
                    context.Request.Path, 
                    context.Request.Method, 
                    stopwatch.ElapsedMilliseconds, 
                    context.Response.StatusCode,
                    orgId,
                    userId);

                // Check for performance alerts (threshold: 1000ms)
                if (stopwatch.ElapsedMilliseconds > 1000)
                {
                    AlertService.RecordAlert(
                        AlertType.PerformanceIssue,
                        AlertSeverity.Medium,
                        "Temps de réponse élevé",
                        $"L'endpoint {context.Request.Path} a pris {stopwatch.ElapsedMilliseconds}ms",
                        $"Méthode: {context.Request.Method}, Status: {context.Response.StatusCode}",
                        orgId,
                        userId);
                }
                
                _logger.Information("Request completed: {Method} {Path} with status {StatusCode} in {ElapsedMs}ms", 
                    context.Request.Method, 
                    context.Request.Path, 
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                // Record error metrics
                var orgId = context.Request.Headers["X-Org-Id"].FirstOrDefault();
                var userId = context.User?.FindFirst("user_id")?.Value;
                MonitoringService.RecordError(
                    "Error",
                    ex.Message,
                    ex.ToString(),
                    orgId,
                    userId,
                    context.Request.Path,
                    correlationId);

                // Record critical error alert
                AlertService.RecordAlert(
                    AlertType.CriticalError,
                    AlertSeverity.Critical,
                    "Erreur critique dans l'application",
                    $"Exception non gérée: {ex.Message}",
                    $"Path: {context.Request.Path}, Method: {context.Request.Method}, Exception: {ex}",
                    orgId,
                    userId);
                
                _logger.Error(ex, "Request failed: {Method} {Path} with status {StatusCode} in {ElapsedMs}ms", 
                    context.Request.Method, 
                    context.Request.Path, 
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
                
                throw;
            }
        }
    }
}

/// <summary>
/// Extension methods for registering the logging correlation middleware
/// </summary>
public static class LoggingCorrelationMiddlewareExtensions
{
    public static IApplicationBuilder UseLoggingCorrelation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<LoggingCorrelationMiddleware>();
    }
}
