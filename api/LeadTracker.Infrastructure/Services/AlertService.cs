using LeadTracker.Core.Services;
using Serilog;
using System.Collections.Concurrent;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service d'alertes implémenté
/// </summary>
public class AlertService : IAlertService
{
    private readonly ILogger _logger;
    private static readonly ConcurrentBag<Alert> _alerts = new();
    private static readonly object _lock = new();

    public AlertService(ILogger logger)
    {
        _logger = logger;
    }

    public async Task SendCriticalErrorAlertAsync(string message, string? details = null, string? organizationId = null, string? userId = null)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        var alert = new Alert
        {
            Type = AlertType.CriticalError,
            Severity = AlertSeverity.Critical,
            Title = "Erreur Critique Détectée",
            Message = message,
            Details = details,
            OrganizationId = organizationId,
            UserId = userId,
            Metadata = new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["source"] = "LeadTracker.API"
            }
        };

        _alerts.Add(alert);

        // Log l'alerte
        _logger.Error("🚨 ALERTE CRITIQUE: {Message} | Org: {OrganizationId} | User: {UserId} | Details: {Details}",
            message, organizationId, userId, details);

        // Dans un environnement de production, vous pourriez envoyer des notifications par email, Slack, etc.
        await SendNotificationAsync(alert);
    }

    public async Task SendPerformanceAlertAsync(string endpoint, long responseTime, int threshold)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        var alert = new Alert
        {
            Type = AlertType.PerformanceIssue,
            Severity = responseTime > threshold * 2 ? AlertSeverity.High : AlertSeverity.Medium,
            Title = "Problème de Performance",
            Message = $"Le temps de réponse de {endpoint} est de {responseTime}ms (seuil: {threshold}ms)",
            Details = $"Endpoint: {endpoint}, Temps de réponse: {responseTime}ms, Seuil: {threshold}ms",
            Metadata = new Dictionary<string, object>
            {
                ["endpoint"] = endpoint,
                ["responseTime"] = responseTime,
                ["threshold"] = threshold,
                ["timestamp"] = DateTime.UtcNow
            }
        };

        _alerts.Add(alert);

        _logger.Warning("⚠️ ALERTE PERFORMANCE: {Endpoint} - {ResponseTime}ms (seuil: {Threshold}ms)",
            endpoint, responseTime, threshold);

        await SendNotificationAsync(alert);
    }

    public async Task SendHighErrorRateAlertAsync(double errorRate, int totalRequests)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        var severity = errorRate > 0.5 ? AlertSeverity.Critical : 
                      errorRate > 0.2 ? AlertSeverity.High : AlertSeverity.Medium;

        var alert = new Alert
        {
            Type = AlertType.HighErrorRate,
            Severity = severity,
            Title = "Taux d'Erreur Élevé",
            Message = $"Le taux d'erreur est de {errorRate:P2} ({totalRequests} requêtes totales)",
            Details = $"Taux d'erreur: {errorRate:P2}, Total requêtes: {totalRequests}",
            Metadata = new Dictionary<string, object>
            {
                ["errorRate"] = errorRate,
                ["totalRequests"] = totalRequests,
                ["timestamp"] = DateTime.UtcNow
            }
        };

        _alerts.Add(alert);

        _logger.Warning("⚠️ ALERTE TAUX D'ERREUR: {ErrorRate:P2} ({TotalRequests} requêtes)",
            errorRate, totalRequests);

        await SendNotificationAsync(alert);
    }

    public async Task<List<Alert>> GetRecentAlertsAsync(int count = 10)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        return _alerts
            .OrderByDescending(a => a.CreatedAt)
            .Take(count)
            .ToList();
    }

    public async Task MarkAlertAsResolvedAsync(string alertId)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        var alert = _alerts.FirstOrDefault(a => a.Id == alertId);
        if (alert != null)
        {
            alert.ResolvedAt = DateTime.UtcNow;
            _logger.Information("✅ Alerte résolue: {AlertId} - {Title}", alertId, alert.Title);
        }
    }

    /// <summary>
    /// Envoie une notification pour une alerte
    /// </summary>
    private async Task SendNotificationAsync(Alert alert)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        // Dans un environnement de production, vous pourriez:
        // - Envoyer un email aux administrateurs
        // - Envoyer une notification Slack
        // - Envoyer une notification Teams
        // - Utiliser un service comme PagerDuty

        // Pour l'instant, on log simplement l'alerte
        var emoji = alert.Severity switch
        {
            AlertSeverity.Critical => "🚨",
            AlertSeverity.High => "⚠️",
            AlertSeverity.Medium => "⚡",
            AlertSeverity.Low => "ℹ️",
            _ => "📢"
        };

        _logger.Information("{Emoji} NOTIFICATION ALERTE: {Type} - {Title} | {Message}",
            emoji, alert.Type, alert.Title, alert.Message);
    }

    /// <summary>
    /// Méthode statique pour enregistrer une alerte depuis le middleware
    /// </summary>
    public static void RecordAlert(AlertType type, AlertSeverity severity, string title, string message, string? details = null, string? organizationId = null, string? userId = null)
    {
        var alert = new Alert
        {
            Type = type,
            Severity = severity,
            Title = title,
            Message = message,
            Details = details,
            OrganizationId = organizationId,
            UserId = userId,
            Metadata = new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["source"] = "LeadTracker.Middleware"
            }
        };

        _alerts.Add(alert);
    }
}

