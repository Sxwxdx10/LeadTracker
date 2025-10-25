using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for activity management
/// </summary>
public class ActivityService : IActivityService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ActivityService> _logger;

    public ActivityService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<ActivityService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<ActivityListResponseDto> GetActivitiesAsync(ActivityQueryDto query)
    {
        _logger.LogInformation("GetActivitiesAsync called with query parameters");

        var activitiesQuery = _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .Include(a => a.Lead)
            .Include(a => a.User)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            activitiesQuery = activitiesQuery.Where(a =>
                a.Title.ToLower().Contains(searchTerm) ||
                (a.Description != null && a.Description.ToLower().Contains(searchTerm)) ||
                (a.Outcome != null && a.Outcome.ToLower().Contains(searchTerm)));
        }

        // Apply filters
        if (query.LeadId.HasValue)
        {
            activitiesQuery = activitiesQuery.Where(a => a.LeadId == query.LeadId.Value);
        }

        if (query.UserId.HasValue)
        {
            activitiesQuery = activitiesQuery.Where(a => a.UserId == query.UserId.Value);
        }

        if (!string.IsNullOrEmpty(query.Type))
        {
            activitiesQuery = activitiesQuery.Where(a => a.Type == query.Type);
        }

        if (!string.IsNullOrEmpty(query.Status))
        {
            activitiesQuery = activitiesQuery.Where(a => a.Status == query.Status);
        }

        if (query.ScheduledFrom.HasValue)
        {
            activitiesQuery = activitiesQuery.Where(a => a.ScheduledAt >= query.ScheduledFrom.Value);
        }

        if (query.ScheduledTo.HasValue)
        {
            activitiesQuery = activitiesQuery.Where(a => a.ScheduledAt <= query.ScheduledTo.Value);
        }

        // Apply sorting
        activitiesQuery = query.SortBy?.ToLower() switch
        {
            "title" => query.SortDirection == "asc" ? activitiesQuery.OrderBy(a => a.Title) : activitiesQuery.OrderByDescending(a => a.Title),
            "type" => query.SortDirection == "asc" ? activitiesQuery.OrderBy(a => a.Type) : activitiesQuery.OrderByDescending(a => a.Type),
            "status" => query.SortDirection == "asc" ? activitiesQuery.OrderBy(a => a.Status) : activitiesQuery.OrderByDescending(a => a.Status),
            "completedat" => query.SortDirection == "asc" ? activitiesQuery.OrderBy(a => a.CompletedAt) : activitiesQuery.OrderByDescending(a => a.CompletedAt),
            _ => query.SortDirection == "asc" ? activitiesQuery.OrderBy(a => a.ScheduledAt) : activitiesQuery.OrderByDescending(a => a.ScheduledAt)
        };

        // Get total count
        var totalCount = await activitiesQuery.CountAsync();

        // Apply pagination
        var activities = await activitiesQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Map to DTOs
        var activityDtos = activities.Select(MapToResponseDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new ActivityListResponseDto
        {
            Data = activityDtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.PageNumber > 1,
            HasNextPage = query.PageNumber < totalPages
        };
    }

    public async Task<ActivityResponseDto?> GetActivityByIdAsync(Guid id)
    {
        var activity = await _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .Include(a => a.Lead)
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        return activity != null ? MapToResponseDto(activity) : null;
    }

    public async Task<ActivityResponseDto> CreateActivityAsync(CreateActivityDto createDto)
    {
        if (!_tenantContext.OrganizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        if (!_tenantContext.UserId.HasValue)
        {
            throw new InvalidOperationException("User context is not available");
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            Title = createDto.Title,
            Description = createDto.Description,
            Type = createDto.Type,
            Status = "Planned",
            ScheduledAt = createDto.ScheduledAt,
            Location = createDto.Location,
            LeadId = createDto.LeadId,
            UserId = _tenantContext.UserId.Value,
            OrganizationId = _tenantContext.OrganizationId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Activity {ActivityId} created successfully", activity.Id);

        return await GetActivityByIdAsync(activity.Id) ?? throw new InvalidOperationException("Failed to retrieve created activity");
    }

    public async Task<ActivityResponseDto?> UpdateActivityAsync(Guid id, UpdateActivityDto updateDto)
    {
        var activity = await _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (activity == null)
        {
            return null;
        }

        activity.Title = updateDto.Title;
        activity.Description = updateDto.Description;
        activity.Type = updateDto.Type;
        activity.Status = updateDto.Status;
        activity.ScheduledAt = updateDto.ScheduledAt;
        activity.CompletedAt = updateDto.CompletedAt;
        activity.DurationMinutes = updateDto.DurationMinutes;
        activity.Location = updateDto.Location;
        activity.Outcome = updateDto.Outcome;
        activity.LeadId = updateDto.LeadId;
        activity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Activity {ActivityId} updated successfully", activity.Id);

        return await GetActivityByIdAsync(activity.Id);
    }

    public async Task<bool> DeleteActivityAsync(Guid id)
    {
        var activity = await _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (activity == null)
        {
            return false;
        }

        _context.Activities.Remove(activity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Activity {ActivityId} deleted successfully", id);

        return true;
    }

    public async Task<List<ActivityResponseDto>> GetActivitiesByLeadIdAsync(Guid leadId)
    {
        var activities = await _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId && a.LeadId == leadId)
            .Include(a => a.Lead)
            .Include(a => a.User)
            .OrderByDescending(a => a.ScheduledAt)
            .ToListAsync();

        return activities.Select(MapToResponseDto).ToList();
    }

    public async Task<List<ActivityResponseDto>> GetMyActivitiesAsync()
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return new List<ActivityResponseDto>();
        }

        var activities = await _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId && a.UserId == _tenantContext.UserId.Value)
            .Include(a => a.Lead)
            .Include(a => a.User)
            .OrderByDescending(a => a.ScheduledAt)
            .ToListAsync();

        return activities.Select(MapToResponseDto).ToList();
    }

    public async Task<ActivityResponseDto?> CompleteActivityAsync(Guid id, string? outcome, int? durationMinutes)
    {
        var activity = await _context.Activities
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (activity == null)
        {
            return null;
        }

        activity.Status = "Completed";
        activity.CompletedAt = DateTime.UtcNow;
        activity.Outcome = outcome;
        activity.DurationMinutes = durationMinutes;
        activity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Activity {ActivityId} completed successfully", id);

        return await GetActivityByIdAsync(id);
    }

    private static ActivityResponseDto MapToResponseDto(Activity activity)
    {
        return new ActivityResponseDto
        {
            Id = activity.Id,
            Title = activity.Title,
            Description = activity.Description,
            Type = activity.Type,
            Status = activity.Status,
            ScheduledAt = activity.ScheduledAt,
            CompletedAt = activity.CompletedAt,
            DurationMinutes = activity.DurationMinutes,
            Location = activity.Location,
            Outcome = activity.Outcome,
            LeadId = activity.LeadId,
            UserId = activity.UserId,
            CreatedAt = activity.CreatedAt,
            UpdatedAt = activity.UpdatedAt,
            LeadTitle = activity.Lead?.Title,
            UserName = activity.User?.FullName,
            IsCompleted = activity.IsCompleted,
            IsOverdue = activity.IsOverdue
        };
    }
}

