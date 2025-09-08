using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        var leadsQuery = _context.GetLeadsForCurrentTenant()
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            leadsQuery = leadsQuery.Where(l => 
                l.Title.ToLower().Contains(searchTerm) ||
                l.FirstName!.ToLower().Contains(searchTerm) ||
                l.LastName!.ToLower().Contains(searchTerm) ||
                l.Email!.ToLower().Contains(searchTerm) ||
                l.Company!.ToLower().Contains(searchTerm) ||
                l.Notes!.ToLower().Contains(searchTerm));
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

        // Apply pagination
        var leads = await leadsQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Map to DTOs
        var leadDtos = leads.Select(MapToResponseDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new LeadListResponseDto
        {
            Leads = leadDtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
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
