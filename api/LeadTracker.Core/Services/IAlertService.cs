using System.Collections.Generic;
using System.Threading.Tasks;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service d'alertes pour les erreurs critiques
/// </summary>
public interface IAlertService
{
    /// <summary>
    /// Envoie une alerte pour une erreur critique
    /// </summary>
    Task SendCriticalErrorAlertAsync(string message, string? details = null, string? organizationId = null, string? userId = null);

    /// <summary>
    /// Envoie une alerte pour un problème de performance
    /// </summary>
    Task SendPerformanceAlertAsync(string endpoint, long responseTime, int threshold);

    /// <summary>
    /// Envoie une alerte pour un taux d'erreur élevé
    /// </summary>
    Task SendHighErrorRateAlertAsync(double errorRate, int totalRequests);

    /// <summary>
    /// Obtient les alertes récentes
    /// </summary>
    Task<List<Alert>> GetRecentAlertsAsync(int count = 10);

    /// <summary>
    /// Marque une alerte comme résolue
    /// </summary>
    Task MarkAlertAsResolvedAsync(string alertId);
}

/// <summary>
/// Représente une alerte
/// </summary>
public class Alert
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? OrganizationId { get; set; }
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public bool IsResolved => ResolvedAt.HasValue;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Types d'alertes
/// </summary>
public enum AlertType
{
    CriticalError,
    PerformanceIssue,
    HighErrorRate,
    SecurityIssue,
    SystemDown,
    DatabaseIssue,
    ExternalServiceIssue
}

/// <summary>
/// Niveaux de sévérité des alertes
/// </summary>
public enum AlertSeverity
{
    Low,
    Medium,
    High,
    Critical
}

