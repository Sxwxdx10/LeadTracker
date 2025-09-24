using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// Request for searching and filtering leads
/// </summary>
public class LeadSearchRequest
{
    /// <summary>
    /// Full-text search query
    /// </summary>
    [MaxLength(500)]
    public string? SearchQuery { get; set; }

    /// <summary>
    /// Stage IDs to filter by
    /// </summary>
    public List<Guid>? StageIds { get; set; }

    /// <summary>
    /// Owner user IDs to filter by
    /// </summary>
    public List<Guid>? OwnerIds { get; set; }

    /// <summary>
    /// Tags to filter by
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Date range filter - start date
    /// </summary>
    public DateTime? CreatedFrom { get; set; }

    /// <summary>
    /// Date range filter - end date
    /// </summary>
    public DateTime? CreatedTo { get; set; }

    /// <summary>
    /// Last activity date range - start date
    /// </summary>
    public DateTime? LastActivityFrom { get; set; }

    /// <summary>
    /// Last activity date range - end date
    /// </summary>
    public DateTime? LastActivityTo { get; set; }

    /// <summary>
    /// Lead status to filter by
    /// </summary>
    public List<string>? Statuses { get; set; }

    /// <summary>
    /// Source to filter by
    /// </summary>
    public List<string>? Sources { get; set; }

    /// <summary>
    /// Priority levels to filter by
    /// </summary>
    public List<string>? Priorities { get; set; }

    /// <summary>
    /// Sort field
    /// </summary>
    public string? SortBy { get; set; } = "CreatedAt";

    /// <summary>
    /// Sort direction
    /// </summary>
    public string? SortDirection { get; set; } = "desc";

    /// <summary>
    /// Page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Page size
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Whether to include inactive leads
    /// </summary>
    public bool IncludeInactive { get; set; } = false;
}

/// <summary>
/// Response for lead search results
/// </summary>
public class LeadSearchResponse
{
    /// <summary>
    /// List of leads matching the search criteria
    /// </summary>
    public List<LeadSearchResult> Leads { get; set; } = new();

    /// <summary>
    /// Total number of leads matching the criteria
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Page size
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// Search execution time in milliseconds
    /// </summary>
    public long ExecutionTimeMs { get; set; }

    /// <summary>
    /// Available filter options based on current results
    /// </summary>
    public SearchFilterOptions? FilterOptions { get; set; }
}

/// <summary>
/// Individual lead search result
/// </summary>
public class LeadSearchResult
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? Source { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; }

    // Related entities
    public Guid? StageId { get; set; }
    public string? StageName { get; set; }
    public string? StageColor { get; set; }
    public Guid? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }

    // Search relevance score (for full-text search)
    public double? RelevanceScore { get; set; }
}

/// <summary>
/// Available filter options for the search
/// </summary>
public class SearchFilterOptions
{
    /// <summary>
    /// Available stages
    /// </summary>
    public List<FilterOption> Stages { get; set; } = new();

    /// <summary>
    /// Available owners
    /// </summary>
    public List<FilterOption> Owners { get; set; } = new();

    /// <summary>
    /// Available tags
    /// </summary>
    public List<FilterOption> Tags { get; set; } = new();

    /// <summary>
    /// Available statuses
    /// </summary>
    public List<FilterOption> Statuses { get; set; } = new();

    /// <summary>
    /// Available sources
    /// </summary>
    public List<FilterOption> Sources { get; set; } = new();

    /// <summary>
    /// Available priorities
    /// </summary>
    public List<FilterOption> Priorities { get; set; } = new();
}

/// <summary>
/// Individual filter option
/// </summary>
public class FilterOption
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
    public string? Color { get; set; }
}

/// <summary>
/// Request for getting autocomplete suggestions
/// </summary>
public class AutocompleteRequest
{
    /// <summary>
    /// Search query for autocomplete
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// Type of autocomplete (tags, owners, companies, etc.)
    /// </summary>
    [Required]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Maximum number of suggestions to return
    /// </summary>
    [Range(1, 50)]
    public int Limit { get; set; } = 10;
}

/// <summary>
/// Response for autocomplete suggestions
/// </summary>
public class AutocompleteResponse
{
    public List<AutocompleteSuggestion> Suggestions { get; set; } = new();
    public string Type { get; set; } = string.Empty;
    public int TotalCount { get; set; }
}

/// <summary>
/// Individual autocomplete suggestion
/// </summary>
public class AutocompleteSuggestion
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public int Count { get; set; }
}

/// <summary>
/// Request for saving search filters
/// </summary>
public class SaveSearchFilterRequest
{
    /// <summary>
    /// Name of the saved filter
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the saved filter
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// The search criteria to save
    /// </summary>
    [Required]
    public LeadSearchRequest SearchCriteria { get; set; } = new();

    /// <summary>
    /// Whether this is a shared filter (visible to all users in organization)
    /// </summary>
    public bool IsShared { get; set; } = false;
}

/// <summary>
/// Response for saved search filters
/// </summary>
public class SavedSearchFilter
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public LeadSearchRequest SearchCriteria { get; set; } = new();
    public bool IsShared { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UsageCount { get; set; }
}

/// <summary>
/// Request for updating search filter usage
/// </summary>
public class UpdateFilterUsageRequest
{
    [Required]
    public Guid FilterId { get; set; }
}
