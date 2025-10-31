using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for analytics
/// </summary>
public class AnalyticsService : IAnalyticsService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AnalyticsService> _logger;

    // Colors for different sources (for pie chart)
    private static readonly Dictionary<string, string> SourceColors = new()
    {
        { "Website", "#3B82F6" },
        { "LinkedIn", "#0077B5" },
        { "Email Marketing", "#10B981" },
        { "Cold Call", "#F59E0B" },
        { "Référence", "#8B5CF6" },
        { "Reference", "#8B5CF6" },
        { "Événements", "#EF4444" },
        { "Events", "#EF4444" }
    };

    public AnalyticsService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<AnalyticsService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<AnalyticsResponseDto> GetAnalyticsAsync(AnalyticsQueryDto query)
    {
        var response = new AnalyticsResponseDto
        {
            GlobalMetrics = await GetGlobalMetricsAsync(query),
            ConversionFunnel = await GetConversionFunnelAsync(query),
            SourceAnalysis = await GetSourceAnalysisAsync(query),
            UserPerformance = await GetUserPerformanceAsync(query),
            TemporalTrends = await GetTemporalTrendsAsync(query)
        };

        return response;
    }

    public async Task<List<ConversionFunnelDataDto>> GetConversionFunnelAsync(AnalyticsQueryDto query)
    {
        var dateRange = GetDateRange(query);
        
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Include(l => l.Stage)
            .Where(l => l.CreatedAt >= dateRange.Start && l.CreatedAt <= dateRange.End);

        if (query.UserId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == query.UserId.Value);
        }

        var leads = await leadsQuery.ToListAsync();
        var stages = await _context.GetStagesForCurrentTenant()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Order)
            .ToListAsync();

        if (!stages.Any() || !leads.Any())
        {
            return new List<ConversionFunnelDataDto>();
        }

        var totalLeads = leads.Count;
        var funnelData = new List<ConversionFunnelDataDto>();

        foreach (var stage in stages)
        {
            var stageLeads = leads.Where(l => l.StageId == stage.Id).ToList();
            var value = stageLeads.Count;
            var percentage = totalLeads > 0 ? (value / (double)totalLeads) * 100 : 0;

            funnelData.Add(new ConversionFunnelDataDto
            {
                Stage = stage.Name,
                StageId = stage.Id.ToString(),
                Value = value,
                Percentage = Math.Round(percentage, 1),
                Color = stage.Color,
                Order = stage.Order
            });
        }

        return funnelData;
    }

    public async Task<List<SourceAnalysisDataDto>> GetSourceAnalysisAsync(AnalyticsQueryDto query)
    {
        var dateRange = GetDateRange(query);
        
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Where(l => l.CreatedAt >= dateRange.Start && l.CreatedAt <= dateRange.End);

        if (query.UserId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == query.UserId.Value);
        }

        var leads = await leadsQuery.ToListAsync();

        if (!leads.Any())
        {
            return new List<SourceAnalysisDataDto>();
        }

        var sourceGroups = leads
            .Where(l => !string.IsNullOrEmpty(l.Source))
            .GroupBy(l => l.Source)
            .Select(g => new
            {
                Source = g.Key!,
                Leads = g.Count(),
                Conversions = g.Count(l => l.Status == "Won"),
                Revenue = g.Where(l => l.Status == "Won" && l.EstimatedValue.HasValue)
                          .Sum(l => l.EstimatedValue!.Value)
            })
            .ToList();

        var result = sourceGroups.Select(g => new SourceAnalysisDataDto
        {
            Source = g.Source,
            Leads = g.Leads,
            Conversions = g.Conversions,
            Revenue = g.Revenue,
            ConversionRate = g.Leads > 0 ? Math.Round((g.Conversions / (double)g.Leads) * 100, 1) : 0,
            Color = SourceColors.GetValueOrDefault(g.Source, "#6B7280")
        })
        .OrderByDescending(s => s.Revenue)
        .ToList();

        return result;
    }

    public async Task<List<UserPerformanceDataDto>> GetUserPerformanceAsync(AnalyticsQueryDto query)
    {
        var dateRange = GetDateRange(query);
        
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Include(l => l.AssignedUser)
            .Where(l => l.CreatedAt >= dateRange.Start && l.CreatedAt <= dateRange.End && l.AssignedUserId.HasValue);

        if (query.UserId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == query.UserId.Value);
        }

        var leads = await leadsQuery.ToListAsync();

        if (!leads.Any())
        {
            return new List<UserPerformanceDataDto>();
        }

        var userGroups = leads
            .GroupBy(l => new { l.AssignedUserId, l.AssignedUser })
            .Select(g => new
            {
                UserId = g.Key.AssignedUserId!.Value,
                UserName = g.Key.AssignedUser != null 
                    ? $"{g.Key.AssignedUser.FirstName} {g.Key.AssignedUser.LastName}".Trim()
                    : "Unknown",
                Leads = g.Count(),
                Conversions = g.Count(l => l.Status == "Won"),
                Revenue = g.Where(l => l.Status == "Won" && l.EstimatedValue.HasValue)
                          .Sum(l => l.EstimatedValue!.Value),
                WonLeads = g.Where(l => l.Status == "Won").ToList()
            })
            .ToList();

        var result = userGroups.Select(g =>
        {
            var avgDealSize = g.Conversions > 0 ? g.Revenue / g.Conversions : 0;
            
            // Calculate average sales cycle: time from CreatedAt to UpdatedAt for won leads
            var salesCycleDays = g.WonLeads
                .Select(l => (l.UpdatedAt - l.CreatedAt).TotalDays)
                .Where(days => days >= 0) // Filter out negative values
                .ToList();
            
            var avgSalesCycle = salesCycleDays.Any() 
                ? Math.Round(salesCycleDays.Average(), 1) 
                : 0;

            return new UserPerformanceDataDto
            {
                UserId = g.UserId.ToString(),
                UserName = g.UserName,
                Leads = g.Leads,
                Conversions = g.Conversions,
                Revenue = g.Revenue,
                ConversionRate = g.Leads > 0 ? Math.Round((g.Conversions / (double)g.Leads) * 100, 1) : 0,
                AvgDealSize = avgDealSize,
                AvgSalesCycle = avgSalesCycle
            };
        })
        .OrderByDescending(u => u.Revenue)
        .ToList();

        return result;
    }

    public async Task<List<TemporalTrendDataDto>> GetTemporalTrendsAsync(AnalyticsQueryDto query)
    {
        var dateRange = GetDateRange(query);
        
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Where(l => l.CreatedAt >= dateRange.Start && l.CreatedAt <= dateRange.End);

        if (query.UserId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == query.UserId.Value);
        }

        var leads = await leadsQuery.ToListAsync();

        if (!leads.Any())
        {
            return new List<TemporalTrendDataDto>();
        }

        // Group by period based on query period
        var groupByFunction = query.Period switch
        {
            "7d" => (Func<DateTime, string>)(d => d.ToString("ddd d")), // Day of week
            "30d" => d => d.ToString("MMM d"), // Day of month
            "90d" => d => d.ToString("MMM yyyy"), // Month
            "1y" => d => d.ToString("MMM yyyy"), // Month
            _ => d => d.ToString("MMM d") // Default to day
        };

        var periodGroups = leads
            .GroupBy(l => groupByFunction(l.CreatedAt))
            .Select(g => new
            {
                Period = g.Key,
                Leads = g.Count(),
                Conversions = g.Count(l => l.Status == "Won"),
                WonLeads = g.Where(l => l.Status == "Won").ToList()
            })
            .OrderBy(g => g.Period)
            .ToList();

        var result = periodGroups.Select(g =>
        {
            var revenue = g.WonLeads
                .Where(l => l.EstimatedValue.HasValue)
                .Sum(l => l.EstimatedValue!.Value);
            
            var avgDealSize = g.Conversions > 0 ? revenue / g.Conversions : 0;

            return new TemporalTrendDataDto
            {
                Period = g.Period,
                Leads = g.Leads,
                Conversions = g.Conversions,
                Revenue = revenue,
                ConversionRate = g.Leads > 0 ? Math.Round((g.Conversions / (double)g.Leads) * 100, 1) : 0,
                AvgDealSize = avgDealSize
            };
        })
        .ToList();

        return result;
    }

    public async Task<GlobalMetricsDto> GetGlobalMetricsAsync(AnalyticsQueryDto query)
    {
        var dateRange = GetDateRange(query);
        
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Where(l => l.CreatedAt >= dateRange.Start && l.CreatedAt <= dateRange.End);

        if (query.UserId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == query.UserId.Value);
        }

        var leads = await leadsQuery.ToListAsync();

        var totalLeads = leads.Count;
        var totalConversions = leads.Count(l => l.Status == "Won");
        var totalRevenue = leads
            .Where(l => l.Status == "Won" && l.EstimatedValue.HasValue)
            .Sum(l => l.EstimatedValue!.Value);
        
        var avgConversionRate = totalLeads > 0 
            ? Math.Round((totalConversions / (double)totalLeads) * 100, 1) 
            : 0;

        return new GlobalMetricsDto
        {
            TotalLeads = totalLeads,
            TotalConversions = totalConversions,
            TotalRevenue = totalRevenue,
            AvgConversionRate = avgConversionRate
        };
    }

    /// <summary>
    /// Calculate date range based on query period
    /// </summary>
    private (DateTime Start, DateTime End) GetDateRange(AnalyticsQueryDto query)
    {
        var endDate = query.EndDate ?? DateTime.UtcNow;
        DateTime startDate;

        if (query.Period == "custom" && query.StartDate.HasValue)
        {
            startDate = query.StartDate.Value;
        }
        else
        {
            startDate = query.Period switch
            {
                "7d" => endDate.AddDays(-7),
                "30d" => endDate.AddDays(-30),
                "90d" => endDate.AddDays(-90),
                "1y" => endDate.AddYears(-1),
                _ => endDate.AddDays(-30) // Default to 30 days
            };
        }

        // Ensure startDate is before endDate
        if (startDate > endDate)
        {
            startDate = endDate.AddDays(-30);
        }

        return (Start: startDate, End: endDate);
    }
}

