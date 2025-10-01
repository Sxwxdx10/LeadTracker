using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System.Diagnostics;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service de monitoring implémenté
/// </summary>
public class MonitoringService : IMonitoringService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger _logger;
    private static readonly Dictionary<string, long> _requestCounts = new();
    private static readonly Dictionary<string, long> _responseTimes = new();
    private static readonly List<ErrorLog> _recentErrors = new();
    private static readonly List<PerformanceMetric> _performanceMetrics = new();
    private static readonly object _lock = new();

    public MonitoringService(LeadTrackerDbContext context, ILogger logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApplicationMetrics> GetApplicationMetricsAsync()
    {
        try
        {
            var totalLeads = await _context.Leads.CountAsync();
            var totalUsers = await _context.Users.CountAsync();
            var totalOrganizations = await _context.Organizations.CountAsync();

            lock (_lock)
            {
                var totalRequests = _requestCounts.Values.Sum();
                var successfulRequests = _requestCounts.Where(kvp => kvp.Key.StartsWith("2")).Sum(kvp => kvp.Value);
                var failedRequests = _requestCounts.Where(kvp => kvp.Key.StartsWith("4") || kvp.Key.StartsWith("5")).Sum(kvp => kvp.Value);
                var averageResponseTime = _responseTimes.Values.Any() ? _responseTimes.Values.Average() : 0;

                return new ApplicationMetrics
                {
                    Timestamp = DateTime.UtcNow,
                    TotalRequests = totalRequests,
                    SuccessfulRequests = successfulRequests,
                    FailedRequests = failedRequests,
                    AverageResponseTime = averageResponseTime,
                    ActiveUsers = totalUsers, // Simplified - in real app, track active sessions
                    TotalLeads = totalLeads,
                    TotalUsers = totalUsers,
                    TotalOrganizations = totalOrganizations
                };
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Error getting application metrics");
            return new ApplicationMetrics { Timestamp = DateTime.UtcNow };
        }
    }

    public async Task<LogStatistics> GetLogStatisticsAsync()
    {
        try
        {
            // In a real implementation, you would parse log files or query a log database
            // For now, we'll return mock data based on recent errors
            lock (_lock)
            {
                var totalLogs = _recentErrors.Count;
                var errorLogs = _recentErrors.Count(e => e.Level == "Error");
                var warningLogs = _recentErrors.Count(e => e.Level == "Warning");
                var infoLogs = totalLogs - errorLogs - warningLogs;

                var logsByOrg = _recentErrors
                    .Where(e => !string.IsNullOrEmpty(e.OrganizationId))
                    .GroupBy(e => e.OrganizationId!)
                    .ToDictionary(g => g.Key, g => (long)g.Count());

                var logsByUser = _recentErrors
                    .Where(e => !string.IsNullOrEmpty(e.UserId))
                    .GroupBy(e => e.UserId!)
                    .ToDictionary(g => g.Key, g => (long)g.Count());

                return new LogStatistics
                {
                    Timestamp = DateTime.UtcNow,
                    TotalLogs = totalLogs,
                    InfoLogs = infoLogs,
                    WarningLogs = warningLogs,
                    ErrorLogs = errorLogs,
                    DebugLogs = 0, // Not tracked in our simple implementation
                    LogsByOrganization = logsByOrg,
                    LogsByUser = logsByUser
                };
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Error getting log statistics");
            return new LogStatistics { Timestamp = DateTime.UtcNow };
        }
    }

    public async Task<List<ErrorLog>> GetRecentErrorsAsync(int count = 10)
    {
        await Task.CompletedTask; // Placeholder for async pattern
        
        lock (_lock)
        {
            return _recentErrors
                .OrderByDescending(e => e.Timestamp)
                .Take(count)
                .ToList();
        }
    }

    public async Task<List<PerformanceMetric>> GetPerformanceMetricsAsync()
    {
        await Task.CompletedTask; // Placeholder for async pattern
        
        lock (_lock)
        {
            return _performanceMetrics
                .OrderByDescending(m => m.Timestamp)
                .Take(50) // Last 50 requests
                .ToList();
        }
    }

    /// <summary>
    /// Enregistre une métrique de performance (appelé par le middleware)
    /// </summary>
    public static void RecordPerformanceMetric(string endpoint, string method, long responseTime, int statusCode, string? organizationId = null, string? userId = null)
    {
        lock (_lock)
        {
            // Update request counts
            var statusKey = statusCode.ToString()[0].ToString();
            _requestCounts[statusKey] = _requestCounts.GetValueOrDefault(statusKey, 0) + 1;

            // Update response times
            _responseTimes[endpoint] = responseTime;

            // Add performance metric
            _performanceMetrics.Add(new PerformanceMetric
            {
                Timestamp = DateTime.UtcNow,
                Endpoint = endpoint,
                Method = method,
                ResponseTime = responseTime,
                StatusCode = statusCode,
                OrganizationId = organizationId,
                UserId = userId
            });

            // Keep only last 1000 metrics
            if (_performanceMetrics.Count > 1000)
            {
                _performanceMetrics.RemoveRange(0, _performanceMetrics.Count - 1000);
            }
        }
    }

    /// <summary>
    /// Enregistre une erreur (appelé par le middleware)
    /// </summary>
    public static void RecordError(string level, string message, string? exception = null, string? organizationId = null, string? userId = null, string? requestPath = null, string? correlationId = null)
    {
        lock (_lock)
        {
            _recentErrors.Add(new ErrorLog
            {
                Timestamp = DateTime.UtcNow,
                Level = level,
                Message = message,
                Exception = exception ?? string.Empty,
                OrganizationId = organizationId,
                UserId = userId,
                RequestPath = requestPath,
                CorrelationId = correlationId
            });

            // Keep only last 100 errors
            if (_recentErrors.Count > 100)
            {
                _recentErrors.RemoveRange(0, _recentErrors.Count - 100);
            }
        }
    }
}
