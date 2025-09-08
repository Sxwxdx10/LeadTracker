using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for lead management
/// </summary>
public interface ILeadService
{
    /// <summary>
    /// Get leads with pagination, filtering, and sorting
    /// </summary>
    Task<LeadListResponseDto> GetLeadsAsync(LeadQueryDto query);
    
    /// <summary>
    /// Get a specific lead by ID
    /// </summary>
    Task<LeadResponseDto?> GetLeadByIdAsync(Guid id);
    
    /// <summary>
    /// Create a new lead
    /// </summary>
    Task<LeadResponseDto> CreateLeadAsync(CreateLeadDto createDto);
    
    /// <summary>
    /// Update an existing lead
    /// </summary>
    Task<LeadResponseDto?> UpdateLeadAsync(Guid id, UpdateLeadDto updateDto);
    
    /// <summary>
    /// Delete a lead
    /// </summary>
    Task<bool> DeleteLeadAsync(Guid id);
    
    /// <summary>
    /// Get lead statistics for the current organization
    /// </summary>
    Task<LeadStatsDto> GetLeadStatsAsync();
}

/// <summary>
/// DTO for lead statistics
/// </summary>
public class LeadStatsDto
{
    public int TotalLeads { get; set; }
    public int OpenLeads { get; set; }
    public int WonLeads { get; set; }
    public int LostLeads { get; set; }
    public decimal TotalValue { get; set; }
    public decimal WonValue { get; set; }
    public decimal AverageDealSize { get; set; }
    public double WinRate { get; set; }
}
