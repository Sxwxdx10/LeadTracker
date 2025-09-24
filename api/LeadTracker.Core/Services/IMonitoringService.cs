using System.Collections.Generic;
using System.Threading.Tasks;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service de monitoring pour l'application
/// </summary>
public interface IMonitoringService
{
    /// <summary>
    /// Obtient les métriques de l'application
    /// </summary>
    Task<ApplicationMetrics> GetApplicationMetricsAsync();

    /// <summary>
    /// Obtient les statistiques des logs
    /// </summary>
    Task<LogStatistics> GetLogStatisticsAsync();

    /// <summary>
    /// Obtient les erreurs récentes
    /// </summary>
    Task<List<ErrorLog>> GetRecentErrorsAsync(int count = 10);

    /// <summary>
    /// Obtient les performances des requêtes
    /// </summary>
    Task<List<PerformanceMetric>> GetPerformanceMetricsAsync();
}

/// <summary>
/// Métriques de l'application
/// </summary>
public class ApplicationMetrics
{
    public DateTime Timestamp { get; set; }
    public long TotalRequests { get; set; }
    public long SuccessfulRequests { get; set; }
    public long FailedRequests { get; set; }
    public double AverageResponseTime { get; set; }
    public long ActiveUsers { get; set; }
    public long TotalLeads { get; set; }
    public long TotalUsers { get; set; }
    public long TotalOrganizations { get; set; }
}

/// <summary>
/// Statistiques des logs
/// </summary>
public class LogStatistics
{
    public DateTime Timestamp { get; set; }
    public long TotalLogs { get; set; }
    public long InfoLogs { get; set; }
    public long WarningLogs { get; set; }
    public long ErrorLogs { get; set; }
    public long DebugLogs { get; set; }
    public Dictionary<string, long> LogsByOrganization { get; set; } = new();
    public Dictionary<string, long> LogsByUser { get; set; } = new();
}

/// <summary>
/// Log d'erreur
/// </summary>
public class ErrorLog
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Exception { get; set; } = string.Empty;
    public string? OrganizationId { get; set; }
    public string? UserId { get; set; }
    public string? RequestPath { get; set; }
    public string? CorrelationId { get; set; }
}

/// <summary>
/// Métrique de performance
/// </summary>
public class PerformanceMetric
{
    public DateTime Timestamp { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public long ResponseTime { get; set; }
    public int StatusCode { get; set; }
    public string? OrganizationId { get; set; }
    public string? UserId { get; set; }
}

