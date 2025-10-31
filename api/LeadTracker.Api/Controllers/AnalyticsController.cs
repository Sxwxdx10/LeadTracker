using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for analytics
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get all analytics data
    /// </summary>
    /// <param name="period">Period: 7d, 30d, 90d, 1y, or custom</param>
    /// <param name="startDate">Start date for custom period</param>
    /// <param name="endDate">End date for custom period</param>
    /// <param name="userId">Filter by user ID</param>
    /// <returns>Complete analytics data</returns>
    [HttpGet]
    [ProducesResponseType(typeof(AnalyticsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] string period = "30d",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? userId = null)
    {
        try
        {
            var query = new AnalyticsQueryDto
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                UserId = userId
            };

            var result = await _analyticsService.GetAnalyticsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analytics");
            return StatusCode(500, new { message = "An error occurred while retrieving analytics" });
        }
    }

    /// <summary>
    /// Get conversion funnel data
    /// </summary>
    [HttpGet("funnel")]
    [ProducesResponseType(typeof(List<ConversionFunnelDataDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversionFunnel(
        [FromQuery] string period = "30d",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? userId = null)
    {
        try
        {
            var query = new AnalyticsQueryDto
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                UserId = userId
            };

            var result = await _analyticsService.GetConversionFunnelAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conversion funnel");
            return StatusCode(500, new { message = "An error occurred while retrieving conversion funnel" });
        }
    }

    /// <summary>
    /// Get source analysis data
    /// </summary>
    [HttpGet("sources")]
    [ProducesResponseType(typeof(List<SourceAnalysisDataDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSourceAnalysis(
        [FromQuery] string period = "30d",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? userId = null)
    {
        try
        {
            var query = new AnalyticsQueryDto
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                UserId = userId
            };

            var result = await _analyticsService.GetSourceAnalysisAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving source analysis");
            return StatusCode(500, new { message = "An error occurred while retrieving source analysis" });
        }
    }

    /// <summary>
    /// Get user performance data
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(List<UserPerformanceDataDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserPerformance(
        [FromQuery] string period = "30d",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? userId = null)
    {
        try
        {
            var query = new AnalyticsQueryDto
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                UserId = userId
            };

            var result = await _analyticsService.GetUserPerformanceAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user performance");
            return StatusCode(500, new { message = "An error occurred while retrieving user performance" });
        }
    }

    /// <summary>
    /// Get temporal trends data
    /// </summary>
    [HttpGet("trends")]
    [ProducesResponseType(typeof(List<TemporalTrendDataDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTemporalTrends(
        [FromQuery] string period = "30d",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? userId = null)
    {
        try
        {
            var query = new AnalyticsQueryDto
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                UserId = userId
            };

            var result = await _analyticsService.GetTemporalTrendsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving temporal trends");
            return StatusCode(500, new { message = "An error occurred while retrieving temporal trends" });
        }
    }

    /// <summary>
    /// Get global metrics
    /// </summary>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(GlobalMetricsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGlobalMetrics(
        [FromQuery] string period = "30d",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? userId = null)
    {
        try
        {
            var query = new AnalyticsQueryDto
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                UserId = userId
            };

            var result = await _analyticsService.GetGlobalMetricsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving global metrics");
            return StatusCode(500, new { message = "An error occurred while retrieving global metrics" });
        }
    }
}

