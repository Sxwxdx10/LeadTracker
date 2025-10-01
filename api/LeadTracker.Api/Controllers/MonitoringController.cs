using Microsoft.AspNetCore.Mvc;
using LeadTracker.Core.Services;
using Microsoft.AspNetCore.Authorization;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Contrôleur pour les métriques de monitoring
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for monitoring endpoints
public class MonitoringController : ControllerBase
{
    private readonly IMonitoringService _monitoringService;
    private readonly IAlertService _alertService;
    private readonly ILogger<MonitoringController> _logger;

    public MonitoringController(IMonitoringService monitoringService, IAlertService alertService, ILogger<MonitoringController> logger)
    {
        _monitoringService = monitoringService;
        _alertService = alertService;
        _logger = logger;
    }

    /// <summary>
    /// Obtient les métriques générales de l'application
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            var metrics = await _monitoringService.GetApplicationMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting application metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Obtient les statistiques des logs
    /// </summary>
    [HttpGet("logs/stats")]
    public async Task<IActionResult> GetLogStatistics()
    {
        try
        {
            var stats = await _monitoringService.GetLogStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting log statistics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Obtient les erreurs récentes
    /// </summary>
    [HttpGet("errors")]
    public async Task<IActionResult> GetRecentErrors([FromQuery] int count = 10)
    {
        try
        {
            if (count < 1 || count > 100)
            {
                return BadRequest("Count must be between 1 and 100");
            }

            var errors = await _monitoringService.GetRecentErrorsAsync(count);
            return Ok(errors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent errors");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Obtient les métriques de performance
    /// </summary>
    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformanceMetrics()
    {
        try
        {
            var metrics = await _monitoringService.GetPerformanceMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Obtient les alertes récentes
    /// </summary>
    [HttpGet("alerts")]
    public async Task<IActionResult> GetRecentAlerts([FromQuery] int count = 10)
    {
        try
        {
            if (count < 1 || count > 50)
            {
                return BadRequest("Count must be between 1 and 50");
            }

            var alerts = await _alertService.GetRecentAlertsAsync(count);
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent alerts");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Marque une alerte comme résolue
    /// </summary>
    [HttpPost("alerts/{alertId}/resolve")]
    public async Task<IActionResult> ResolveAlert(string alertId)
    {
        try
        {
            await _alertService.MarkAlertAsResolvedAsync(alertId);
            return Ok(new { message = "Alert resolved successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving alert {AlertId}", alertId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Endpoint de santé simple
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            version = "1.0.0"
        });
    }
}
