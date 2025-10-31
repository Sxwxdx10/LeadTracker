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

    /// <summary>
    /// Search leads with advanced filtering and full-text search
    /// </summary>
    Task<LeadSearchResponse> SearchLeadsAsync(LeadSearchRequest request);

    /// <summary>
    /// Get search suggestions for full-text search
    /// </summary>
    Task<List<SearchSuggestionDto>> GetSearchSuggestionsAsync(string query, int limit = 10);

    /// <summary>
    /// Get autocomplete suggestions for search fields
    /// </summary>
    Task<AutocompleteResponse> GetAutocompleteSuggestionsAsync(AutocompleteRequest request);

    /// <summary>
    /// Get available filter options for search
    /// </summary>
    Task<SearchFilterOptions> GetFilterOptionsAsync(LeadSearchRequest? baseRequest = null);

    /// <summary>
    /// Save a search filter for future use
    /// </summary>
    Task<LeadTracker.Core.DTOs.SavedSearchFilter> SaveSearchFilterAsync(SaveSearchFilterRequest request);

    /// <summary>
    /// Get saved search filters for the current user
    /// </summary>
    Task<List<LeadTracker.Core.DTOs.SavedSearchFilter>> GetSavedSearchFiltersAsync();

    /// <summary>
    /// Update usage count for a saved filter
    /// </summary>
    System.Threading.Tasks.Task UpdateFilterUsageAsync(Guid filterId);

    /// <summary>
    /// Delete a saved search filter
    /// </summary>
    Task<bool> DeleteSavedSearchFilterAsync(Guid filterId);
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
