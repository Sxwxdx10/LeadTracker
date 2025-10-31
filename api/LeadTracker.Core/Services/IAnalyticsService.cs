using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for analytics
/// </summary>
public interface IAnalyticsService
{
    /// <summary>
    /// Get all analytics data
    /// </summary>
    Task<AnalyticsResponseDto> GetAnalyticsAsync(AnalyticsQueryDto query);
    
    /// <summary>
    /// Get conversion funnel data grouped by stages
    /// </summary>
    Task<List<ConversionFunnelDataDto>> GetConversionFunnelAsync(AnalyticsQueryDto query);
    
    /// <summary>
    /// Get source analysis data aggregated by lead source
    /// </summary>
    Task<List<SourceAnalysisDataDto>> GetSourceAnalysisAsync(AnalyticsQueryDto query);
    
    /// <summary>
    /// Get user performance data aggregated by assigned user
    /// </summary>
    Task<List<UserPerformanceDataDto>> GetUserPerformanceAsync(AnalyticsQueryDto query);
    
    /// <summary>
    /// Get temporal trends data grouped by time period
    /// </summary>
    Task<List<TemporalTrendDataDto>> GetTemporalTrendsAsync(AnalyticsQueryDto query);
    
    /// <summary>
    /// Get global metrics (totals and averages)
    /// </summary>
    Task<GlobalMetricsDto> GetGlobalMetricsAsync(AnalyticsQueryDto query);
}

