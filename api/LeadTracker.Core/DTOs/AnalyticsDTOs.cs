namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for analytics query parameters
/// </summary>
public class AnalyticsQueryDto
{
    /// <summary>
    /// Period: 7d, 30d, 90d, 1y, or custom
    /// </summary>
    public string Period { get; set; } = "30d";
    
    /// <summary>
    /// Start date for custom period
    /// </summary>
    public DateTime? StartDate { get; set; }
    
    /// <summary>
    /// End date for custom period
    /// </summary>
    public DateTime? EndDate { get; set; }
    
    /// <summary>
    /// Filter by user ID. Use null or empty for all users
    /// </summary>
    public Guid? UserId { get; set; }
}

/// <summary>
/// DTO for conversion funnel data
/// </summary>
public class ConversionFunnelDataDto
{
    public string Stage { get; set; } = string.Empty;
    public string StageId { get; set; } = string.Empty;
    public int Value { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public int Order { get; set; }
}

/// <summary>
/// DTO for source analysis data
/// </summary>
public class SourceAnalysisDataDto
{
    public string Source { get; set; } = string.Empty;
    public int Leads { get; set; }
    public int Conversions { get; set; }
    public decimal Revenue { get; set; }
    public double ConversionRate { get; set; }
    public string Color { get; set; } = "#3B82F6";
}

/// <summary>
/// DTO for user performance data
/// </summary>
public class UserPerformanceDataDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Leads { get; set; }
    public int Conversions { get; set; }
    public decimal Revenue { get; set; }
    public double ConversionRate { get; set; }
    public decimal AvgDealSize { get; set; }
    public double AvgSalesCycle { get; set; }
}

/// <summary>
/// DTO for temporal trend data
/// </summary>
public class TemporalTrendDataDto
{
    public string Period { get; set; } = string.Empty;
    public int Leads { get; set; }
    public int Conversions { get; set; }
    public decimal Revenue { get; set; }
    public double ConversionRate { get; set; }
    public decimal AvgDealSize { get; set; }
}

/// <summary>
/// DTO for global metrics
/// </summary>
public class GlobalMetricsDto
{
    public int TotalLeads { get; set; }
    public int TotalConversions { get; set; }
    public decimal TotalRevenue { get; set; }
    public double AvgConversionRate { get; set; }
}

/// <summary>
/// DTO for complete analytics response
/// </summary>
public class AnalyticsResponseDto
{
    public GlobalMetricsDto GlobalMetrics { get; set; } = new();
    public List<ConversionFunnelDataDto> ConversionFunnel { get; set; } = new();
    public List<SourceAnalysisDataDto> SourceAnalysis { get; set; } = new();
    public List<UserPerformanceDataDto> UserPerformance { get; set; } = new();
    public List<TemporalTrendDataDto> TemporalTrends { get; set; } = new();
}

