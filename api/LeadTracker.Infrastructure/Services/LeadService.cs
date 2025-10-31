using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for lead management
/// </summary>
public class LeadService : ILeadService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<LeadService> _logger;

    public LeadService(
        LeadTrackerDbContext context, 
        ITenantContext tenantContext, 
        ILogger<LeadService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<LeadListResponseDto> GetLeadsAsync(LeadQueryDto query)
    {
        _logger.LogInformation("GetLeadsAsync called with query: {Query}", System.Text.Json.JsonSerializer.Serialize(query));
        
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .AsQueryable();
            
        _logger.LogInformation("LeadsQuery created, checking tenant context...");
        var orgId = _tenantContext.OrganizationId;
        _logger.LogInformation("Current organization ID: {OrgId}", orgId);

        // Apply search filter
        if (!string.IsNullOrEmpty(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.Trim();
            
            // Simple search with LIKE
            leadsQuery = leadsQuery.Where(l => 
                (l.Title != null && l.Title.Contains(searchTerm)) ||
                (l.FirstName != null && l.FirstName.Contains(searchTerm)) ||
                (l.LastName != null && l.LastName.Contains(searchTerm)) ||
                (l.Email != null && l.Email.Contains(searchTerm)) ||
                (l.Company != null && l.Company.Contains(searchTerm)) ||
                (l.Notes != null && l.Notes.Contains(searchTerm))
            );
        }

        // Apply stage filter
        if (query.StageId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.StageId == query.StageId.Value);
        }

        // Apply assigned user filter
        if (query.AssignedUserId.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == query.AssignedUserId.Value);
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(query.Status))
        {
            leadsQuery = leadsQuery.Where(l => l.Status == query.Status);
        }

        // Apply date range filter
        if (query.CreatedFrom.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.CreatedAt >= query.CreatedFrom.Value);
        }

        if (query.CreatedTo.HasValue)
        {
            leadsQuery = leadsQuery.Where(l => l.CreatedAt <= query.CreatedTo.Value);
        }

        // Apply sorting
        leadsQuery = query.SortBy?.ToLower() switch
        {
            "title" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.Title) : leadsQuery.OrderByDescending(l => l.Title),
            "email" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.Email) : leadsQuery.OrderByDescending(l => l.Email),
            "company" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.Company) : leadsQuery.OrderByDescending(l => l.Company),
            "estimatedvalue" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.EstimatedValue) : leadsQuery.OrderByDescending(l => l.EstimatedValue),
            "probability" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.Probability) : leadsQuery.OrderByDescending(l => l.Probability),
            "stage" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.Stage.Name) : leadsQuery.OrderByDescending(l => l.Stage.Name),
            "assigneduser" => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.AssignedUser!.FirstName) : leadsQuery.OrderByDescending(l => l.AssignedUser!.FirstName),
            _ => query.SortDirection == "asc" ? leadsQuery.OrderBy(l => l.CreatedAt) : leadsQuery.OrderByDescending(l => l.CreatedAt)
        };

        // Get total count before pagination
        var totalCount = await leadsQuery.CountAsync();
        _logger.LogInformation("Total count of leads found: {TotalCount}", totalCount);

        // Apply pagination
        var leads = await leadsQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();
            
        _logger.LogInformation("Leads after pagination: {Count}", leads.Count);

        // Map to DTOs
        var leadDtos = leads.Select(MapToResponseDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new LeadListResponseDto
        {
            Data = leadDtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.PageNumber > 1,
            HasNextPage = query.PageNumber < totalPages
        };
    }

    public async Task<LeadResponseDto?> GetLeadByIdAsync(Guid id)
    {
        var lead = await _context.GetLeadsForCurrentTenant()
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .FirstOrDefaultAsync(l => l.Id == id);

        return lead != null ? MapToResponseDto(lead) : null;
    }

    public async Task<LeadResponseDto> CreateLeadAsync(CreateLeadDto createDto)
    {
        if (!_tenantContext.OrganizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = createDto.Title,
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Email = createDto.Email,
            PhoneNumber = createDto.PhoneNumber,
            Company = createDto.Company,
            JobTitle = createDto.JobTitle,
            EstimatedValue = createDto.EstimatedValue,
            Probability = createDto.Probability,
            ExpectedCloseDate = createDto.ExpectedCloseDate,
            Notes = createDto.Notes,
            Source = createDto.Source,
            Status = "Open",
            StageId = createDto.StageId,
            AssignedUserId = createDto.AssignedUserId,
            OrganizationId = _tenantContext.OrganizationId.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        // Reload with related data
        var createdLead = await _context.GetLeadsForCurrentTenant()
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .FirstAsync(l => l.Id == lead.Id);

        return MapToResponseDto(createdLead);
    }

    public async Task<LeadResponseDto?> UpdateLeadAsync(Guid id, UpdateLeadDto updateDto)
    {
        var lead = await _context.GetLeadsForCurrentTenant()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lead == null)
            return null;

        // Update properties
        lead.Title = updateDto.Title;
        lead.FirstName = updateDto.FirstName;
        lead.LastName = updateDto.LastName;
        lead.Email = updateDto.Email;
        lead.PhoneNumber = updateDto.PhoneNumber;
        lead.Company = updateDto.Company;
        lead.JobTitle = updateDto.JobTitle;
        lead.EstimatedValue = updateDto.EstimatedValue;
        lead.Probability = updateDto.Probability;
        lead.ExpectedCloseDate = updateDto.ExpectedCloseDate;
        lead.Notes = updateDto.Notes;
        lead.Source = updateDto.Source;
        lead.Status = updateDto.Status;
        lead.LastContactedAt = updateDto.LastContactedAt;
        lead.StageId = updateDto.StageId;
        lead.AssignedUserId = updateDto.AssignedUserId;
        lead.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload with related data
        var updatedLead = await _context.GetLeadsForCurrentTenant()
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .FirstAsync(l => l.Id == lead.Id);

        return MapToResponseDto(updatedLead);
    }

    public async Task<bool> DeleteLeadAsync(Guid id)
    {
        var lead = await _context.GetLeadsForCurrentTenant()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lead == null)
            return false;

        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<LeadStatsDto> GetLeadStatsAsync()
    {
        var leads = await _context.GetLeadsForCurrentTenant().ToListAsync();

        var totalLeads = leads.Count;
        var openLeads = leads.Count(l => l.Status == "Open");
        var wonLeads = leads.Count(l => l.Status == "Won");
        var lostLeads = leads.Count(l => l.Status == "Lost");
        
        var totalValue = leads.Where(l => l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value);
        var wonValue = leads.Where(l => l.Status == "Won" && l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value);
        
        var averageDealSize = totalLeads > 0 ? totalValue / totalLeads : 0;
        var winRate = totalLeads > 0 ? (double)wonLeads / totalLeads * 100 : 0;

        return new LeadStatsDto
        {
            TotalLeads = totalLeads,
            OpenLeads = openLeads,
            WonLeads = wonLeads,
            LostLeads = lostLeads,
            TotalValue = totalValue,
            WonValue = wonValue,
            AverageDealSize = averageDealSize,
            WinRate = winRate
        };
    }

    public async Task<LeadSearchResponse> SearchLeadsAsync(LeadSearchRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                throw new InvalidOperationException("Organization context is not available");
            }

            var query = _context.GetLeadsForCurrentTenant()
                .Include(l => l.Stage)
                .Include(l => l.AssignedUser)
                .AsQueryable();

            // Apply full-text search
            if (!string.IsNullOrEmpty(request.SearchQuery))
            {
                var searchTerm = request.SearchQuery.Trim();
                
                // Simple search with LIKE
                query = query.Where(l => 
                    (l.Title != null && l.Title.Contains(searchTerm)) ||
                    (l.FirstName != null && l.FirstName.Contains(searchTerm)) ||
                    (l.LastName != null && l.LastName.Contains(searchTerm)) ||
                    (l.Email != null && l.Email.Contains(searchTerm)) ||
                    (l.Company != null && l.Company.Contains(searchTerm)) ||
                    (l.JobTitle != null && l.JobTitle.Contains(searchTerm)) ||
                    (l.Notes != null && l.Notes.Contains(searchTerm)) ||
                    (l.Source != null && l.Source.Contains(searchTerm))
                );
            }

            // Apply filters
            query = ApplyFilters(query, request);

            // Apply sorting
            query = ApplySorting(query, request);

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var leads = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Map to search results
            var searchResults = leads.Select(MapToSearchResult).ToList();

            stopwatch.Stop();

            return new LeadSearchResponse
            {
                Leads = searchResults,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching leads");
            throw;
        }
    }

    public async Task<List<SearchSuggestionDto>> GetSearchSuggestionsAsync(string query, int limit = 10)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                throw new InvalidOperationException("Organization context is not available");
            }

            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return new List<SearchSuggestionDto>();
            }

            var searchTerm = query.Trim();
            var suggestions = new List<SearchSuggestionDto>();

            // Get suggestions from different fields
            var nameSuggestions = await _context.GetLeadsForCurrentTenant()
                .Where(l => 
                    (l.FirstName != null && l.FirstName.Contains(searchTerm)) ||
                    (l.LastName != null && l.LastName.Contains(searchTerm))
                )
                .Select(l => new SearchSuggestionDto
                {
                    Text = $"{l.FirstName} {l.LastName}".Trim(),
                    Type = "name",
                    Count = 1
                })
                .Take(limit)
                .ToListAsync();

            var emailSuggestions = await _context.GetLeadsForCurrentTenant()
                .Where(l => l.Email != null && l.Email.ToLower().Contains(searchTerm.ToLower()))
                .Select(l => new SearchSuggestionDto
                {
                    Text = l.Email!,
                    Type = "email",
                    Count = 1
                })
                .Take(limit)
                .ToListAsync();

            var companySuggestions = await _context.GetLeadsForCurrentTenant()
                .Where(l => l.Company != null && l.Company.ToLower().Contains(searchTerm.ToLower()))
                .Select(l => new SearchSuggestionDto
                {
                    Text = l.Company!,
                    Type = "company",
                    Count = 1
                })
                .Take(limit)
                .ToListAsync();

            // Combine and deduplicate suggestions
            suggestions.AddRange(nameSuggestions);
            suggestions.AddRange(emailSuggestions);
            suggestions.AddRange(companySuggestions);

            // Group by text and sum counts
            var groupedSuggestions = suggestions
                .GroupBy(s => s.Text)
                .Select(g => new SearchSuggestionDto
                {
                    Text = g.Key,
                    Type = g.First().Type,
                    Count = g.Sum(x => x.Count)
                })
                .OrderByDescending(s => s.Count)
                .ThenBy(s => s.Text)
                .Take(limit)
                .ToList();

            return groupedSuggestions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
            throw;
        }
    }

    public async Task<AutocompleteResponse> GetAutocompleteSuggestionsAsync(AutocompleteRequest request)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                throw new InvalidOperationException("Organization context is not available");
            }

            var query = request.Query.ToLower();
            var suggestions = new List<AutocompleteSuggestion>();

            switch (request.Type.ToLower())
            {
                case "tags":
                    suggestions = await GetTagSuggestions(query, request.Limit);
                    break;
                case "owners":
                    suggestions = await GetOwnerSuggestions(query, request.Limit);
                    break;
                case "companies":
                    suggestions = await GetCompanySuggestions(query, request.Limit);
                    break;
                case "sources":
                    suggestions = await GetSourceSuggestions(query, request.Limit);
                    break;
                case "priorities":
                    suggestions = await GetPrioritySuggestions(query, request.Limit);
                    break;
                default:
                    break;
            }

            return new AutocompleteResponse
            {
                Suggestions = suggestions,
                Type = request.Type,
                TotalCount = suggestions.Count
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting autocomplete suggestions for type {Type}", request.Type);
            throw;
        }
    }

    public async Task<SearchFilterOptions> GetFilterOptionsAsync(LeadSearchRequest? baseRequest = null)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                throw new InvalidOperationException("Organization context is not available");
            }

            var baseQuery = _context.GetLeadsForCurrentTenant();
            if (baseRequest != null)
            {
                baseQuery = ApplyFilters(baseQuery, baseRequest);
            }

            var stages = await baseQuery
                .Include(l => l.Stage)
                .GroupBy(l => new { l.StageId, l.Stage!.Name, l.Stage.Color })
                .Select(g => new FilterOption
                {
                    Value = g.Key.StageId.ToString(),
                    Label = g.Key.Name,
                    Count = g.Count(),
                    Color = g.Key.Color
                })
                .ToListAsync();

            var owners = await baseQuery
                .Include(l => l.AssignedUser)
                .Where(l => l.AssignedUser != null)
                .GroupBy(l => new { l.AssignedUserId, l.AssignedUser!.FirstName, l.AssignedUser.LastName })
                .Select(g => new FilterOption
                {
                    Value = g.Key.AssignedUserId.ToString(),
                    Label = $"{g.Key.FirstName} {g.Key.LastName}".Trim(),
                    Count = g.Count()
                })
                .ToListAsync();

            var statuses = await baseQuery
                .GroupBy(l => l.Status)
                .Select(g => new FilterOption
                {
                    Value = g.Key,
                    Label = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var sources = await baseQuery
                .Where(l => !string.IsNullOrEmpty(l.Source))
                .GroupBy(l => l.Source!)
                .Select(g => new FilterOption
                {
                    Value = g.Key,
                    Label = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return new SearchFilterOptions
            {
                Stages = stages,
                Owners = owners,
                Statuses = statuses,
                Sources = sources
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting filter options");
            throw;
        }
    }

    public async Task<LeadTracker.Core.DTOs.SavedSearchFilter> SaveSearchFilterAsync(SaveSearchFilterRequest request)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            var currentUserId = _tenantContext.UserId;
            
            if (organizationId == null || currentUserId == null)
            {
                throw new InvalidOperationException("Organization or user context is not available");
            }

            var savedFilter = new LeadTracker.Core.Entities.SavedSearchFilter
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                SearchCriteriaJson = JsonSerializer.Serialize(request.SearchCriteria),
                IsShared = request.IsShared,
                CreatedByUserId = currentUserId.Value,
                OrganizationId = organizationId.Value,
                UsageCount = 0,
                LastUsedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SavedSearchFilters.Add(savedFilter);
            await _context.SaveChangesAsync();

            return new LeadTracker.Core.DTOs.SavedSearchFilter
            {
                Id = savedFilter.Id,
                Name = savedFilter.Name,
                Description = savedFilter.Description,
                SearchCriteria = request.SearchCriteria,
                IsShared = savedFilter.IsShared,
                CreatedByUserId = savedFilter.CreatedByUserId,
                CreatedByUserName = "Current User", // TODO: Get actual user name
                CreatedAt = savedFilter.CreatedAt,
                UpdatedAt = savedFilter.UpdatedAt,
                UsageCount = savedFilter.UsageCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving search filter");
            throw;
        }
    }

    public async Task<List<LeadTracker.Core.DTOs.SavedSearchFilter>> GetSavedSearchFiltersAsync()
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            var currentUserId = _tenantContext.UserId;
            
            if (organizationId == null || currentUserId == null)
            {
                throw new InvalidOperationException("Organization or user context is not available");
            }

            var filters = await _context.SavedSearchFilters
                .Where(f => f.OrganizationId == organizationId && 
                           (f.CreatedByUserId == currentUserId || f.IsShared))
                .OrderByDescending(f => f.LastUsedAt)
                .ToListAsync();

            return filters.Select(f => new LeadTracker.Core.DTOs.SavedSearchFilter
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                SearchCriteria = JsonSerializer.Deserialize<LeadSearchRequest>(f.SearchCriteriaJson) ?? new(),
                IsShared = f.IsShared,
                CreatedByUserId = f.CreatedByUserId,
                CreatedByUserName = "User", // TODO: Get actual user name
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt,
                UsageCount = f.UsageCount
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting saved search filters");
            throw;
        }
    }

    public async System.Threading.Tasks.Task UpdateFilterUsageAsync(Guid filterId)
    {
        try
        {
            var filter = await _context.SavedSearchFilters.FindAsync(filterId);
            if (filter != null)
            {
                filter.UsageCount++;
                filter.LastUsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating filter usage for {FilterId}", filterId);
            throw;
        }
    }

    public async Task<bool> DeleteSavedSearchFilterAsync(Guid filterId)
    {
        try
        {
            var currentUserId = _tenantContext.UserId;
            if (currentUserId == null)
            {
                throw new InvalidOperationException("User context is not available");
            }

            var filter = await _context.SavedSearchFilters
                .FirstOrDefaultAsync(f => f.Id == filterId && f.CreatedByUserId == currentUserId);

            if (filter == null)
                return false;

            _context.SavedSearchFilters.Remove(filter);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting saved search filter {FilterId}", filterId);
            throw;
        }
    }

    private IQueryable<Lead> ApplyFilters(IQueryable<Lead> query, LeadSearchRequest request)
    {
        // Stage filter
        if (request.StageIds != null && request.StageIds.Any())
        {
            query = query.Where(l => request.StageIds.Contains(l.StageId));
        }

        // Owner filter
        if (request.OwnerIds != null && request.OwnerIds.Any())
        {
            query = query.Where(l => l.AssignedUserId.HasValue && request.OwnerIds.Contains(l.AssignedUserId.Value));
        }

        // Status filter
        if (request.Statuses != null && request.Statuses.Any())
        {
            query = query.Where(l => request.Statuses.Contains(l.Status));
        }

        // Source filter
        if (request.Sources != null && request.Sources.Any())
        {
            query = query.Where(l => l.Source != null && request.Sources.Contains(l.Source));
        }

        // Date range filters
        if (request.CreatedFrom.HasValue)
        {
            query = query.Where(l => l.CreatedAt >= request.CreatedFrom.Value);
        }

        if (request.CreatedTo.HasValue)
        {
            query = query.Where(l => l.CreatedAt <= request.CreatedTo.Value);
        }

        if (request.LastActivityFrom.HasValue)
        {
            query = query.Where(l => l.LastContactedAt >= request.LastActivityFrom.Value);
        }

        if (request.LastActivityTo.HasValue)
        {
            query = query.Where(l => l.LastContactedAt <= request.LastActivityTo.Value);
        }

        // Active filter
        if (!request.IncludeInactive)
        {
            query = query.Where(l => l.IsActive);
        }

        return query;
    }

    private IQueryable<Lead> ApplySorting(IQueryable<Lead> query, LeadSearchRequest request)
    {
        return request.SortBy?.ToLower() switch
        {
            "name" => request.SortDirection == "asc" ? query.OrderBy(l => l.FullName) : query.OrderByDescending(l => l.FullName),
            "email" => request.SortDirection == "asc" ? query.OrderBy(l => l.Email) : query.OrderByDescending(l => l.Email),
            "company" => request.SortDirection == "asc" ? query.OrderBy(l => l.Company) : query.OrderByDescending(l => l.Company),
            "stage" => request.SortDirection == "asc" ? query.OrderBy(l => l.Stage!.Name) : query.OrderByDescending(l => l.Stage!.Name),
            "owner" => request.SortDirection == "asc" ? query.OrderBy(l => l.AssignedUser!.FirstName) : query.OrderByDescending(l => l.AssignedUser!.FirstName),
            "lastactivity" => request.SortDirection == "asc" ? query.OrderBy(l => l.LastContactedAt) : query.OrderByDescending(l => l.LastContactedAt),
            _ => request.SortDirection == "asc" ? query.OrderBy(l => l.CreatedAt) : query.OrderByDescending(l => l.CreatedAt)
        };
    }

    private async Task<List<AutocompleteSuggestion>> GetTagSuggestions(string query, int limit)
    {
        // For now, return empty list - tags would need to be implemented as a separate entity
        return new List<AutocompleteSuggestion>();
    }

    private async Task<List<AutocompleteSuggestion>> GetOwnerSuggestions(string query, int limit)
    {
        return await _context.BusinessUsers
            .Where(u => u.OrganizationId == _tenantContext.OrganizationId)
            .Where(u => u.FirstName.ToLower().Contains(query) || 
                       u.LastName.ToLower().Contains(query) || 
                       u.Email.ToLower().Contains(query))
            .Select(u => new AutocompleteSuggestion
            {
                Value = u.Id.ToString(),
                Label = $"{u.FirstName} {u.LastName}".Trim(),
                Description = u.Email,
                Count = 0 // TODO: Count leads assigned to this user
            })
            .Take(limit)
            .ToListAsync();
    }

    private async Task<List<AutocompleteSuggestion>> GetCompanySuggestions(string query, int limit)
    {
        return await _context.GetLeadsForCurrentTenant()
            .Where(l => l.Company != null && l.Company.ToLower().Contains(query))
            .GroupBy(l => l.Company!)
            .Select(g => new AutocompleteSuggestion
            {
                Value = g.Key,
                Label = g.Key,
                Count = g.Count()
            })
            .Take(limit)
            .ToListAsync();
    }

    private async Task<List<AutocompleteSuggestion>> GetSourceSuggestions(string query, int limit)
    {
        return await _context.GetLeadsForCurrentTenant()
            .Where(l => l.Source != null && l.Source.ToLower().Contains(query))
            .GroupBy(l => l.Source!)
            .Select(g => new AutocompleteSuggestion
            {
                Value = g.Key,
                Label = g.Key,
                Count = g.Count()
            })
            .Take(limit)
            .ToListAsync();
    }

    private async Task<List<AutocompleteSuggestion>> GetPrioritySuggestions(string query, int limit)
    {
        // For now, return common priority levels
        var priorities = new[] { "High", "Medium", "Low" };
        return priorities
            .Where(p => p.ToLower().Contains(query))
            .Select(p => new AutocompleteSuggestion
            {
                Value = p,
                Label = p,
                Count = 0
            })
            .Take(limit)
            .ToList();
    }

    private static LeadSearchResult MapToSearchResult(Lead lead)
    {
        return new LeadSearchResult
        {
            Id = lead.Id,
            FirstName = lead.FirstName,
            LastName = lead.LastName,
            FullName = lead.FullName,
            Email = lead.Email,
            Company = lead.Company,
            Phone = lead.PhoneNumber,
            JobTitle = lead.JobTitle,
            Source = lead.Source,
            Priority = "Medium", // TODO: Add priority field to Lead entity
            Status = lead.Status,
            Notes = lead.Notes,
            Tags = new List<string>(), // TODO: Implement tags
            CreatedAt = lead.CreatedAt,
            LastActivityAt = lead.LastContactedAt,
            UpdatedAt = lead.UpdatedAt,
            IsActive = lead.IsActive,
            StageId = lead.StageId,
            StageName = lead.Stage?.Name,
            StageColor = lead.Stage?.Color,
            OwnerId = lead.AssignedUserId,
            OwnerName = lead.AssignedUser != null ? $"{lead.AssignedUser.FirstName} {lead.AssignedUser.LastName}".Trim() : null,
            OwnerEmail = lead.AssignedUser?.Email
        };
    }

    private static LeadResponseDto MapToResponseDto(Lead lead)
    {
        return new LeadResponseDto
        {
            Id = lead.Id,
            Title = lead.Title,
            FirstName = lead.FirstName,
            LastName = lead.LastName,
            Email = lead.Email,
            PhoneNumber = lead.PhoneNumber,
            Company = lead.Company,
            JobTitle = lead.JobTitle,
            EstimatedValue = lead.EstimatedValue,
            Probability = lead.Probability,
            ExpectedCloseDate = lead.ExpectedCloseDate,
            Notes = lead.Notes,
            Source = lead.Source,
            Status = lead.Status,
            LastContactedAt = lead.LastContactedAt,
            StageId = lead.StageId,
            AssignedUserId = lead.AssignedUserId,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt,
            StageName = lead.Stage?.Name,
            AssignedUserName = lead.AssignedUser != null ? $"{lead.AssignedUser.FirstName} {lead.AssignedUser.LastName}".Trim() : null,
            FullName = lead.FullName,
            IsQualified = lead.IsQualified
        };
    }
}
