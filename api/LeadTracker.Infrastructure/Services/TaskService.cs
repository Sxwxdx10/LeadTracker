using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for task management
/// </summary>
public class TaskService : ITaskService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<TaskService> _logger;

    public TaskService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<TaskService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<TaskListResponseDto> GetTasksAsync(TaskQueryDto query)
    {
        _logger.LogInformation("GetTasksAsync called with query parameters");

        var tasksQuery = _context.GetTasksForCurrentTenant()
            .Include(t => t.Lead)
            .Include(t => t.AssignedUser)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            tasksQuery = tasksQuery.Where(t =>
                t.Title.ToLower().Contains(searchTerm) ||
                (t.Description != null && t.Description.ToLower().Contains(searchTerm)) ||
                (t.Notes != null && t.Notes.ToLower().Contains(searchTerm)));
        }

        // Apply filters
        if (query.LeadId.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.LeadId == query.LeadId.Value);
        }

        if (query.AssignedUserId.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.AssignedUserId == query.AssignedUserId.Value);
        }

        if (!string.IsNullOrEmpty(query.Type))
        {
            tasksQuery = tasksQuery.Where(t => t.Type == query.Type);
        }

        if (!string.IsNullOrEmpty(query.Status))
        {
            tasksQuery = tasksQuery.Where(t => t.Status == query.Status);
        }

        if (!string.IsNullOrEmpty(query.Priority))
        {
            tasksQuery = tasksQuery.Where(t => t.Priority == query.Priority);
        }

        if (query.DueFrom.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.DueDate >= query.DueFrom.Value);
        }

        if (query.DueTo.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.DueDate <= query.DueTo.Value);
        }

        // Apply sorting
        tasksQuery = query.SortBy?.ToLower() switch
        {
            "title" => query.SortDirection == "asc" ? tasksQuery.OrderBy(t => t.Title) : tasksQuery.OrderByDescending(t => t.Title),
            "type" => query.SortDirection == "asc" ? tasksQuery.OrderBy(t => t.Type) : tasksQuery.OrderByDescending(t => t.Type),
            "status" => query.SortDirection == "asc" ? tasksQuery.OrderBy(t => t.Status) : tasksQuery.OrderByDescending(t => t.Status),
            "priority" => query.SortDirection == "asc" ? tasksQuery.OrderBy(t => t.Priority) : tasksQuery.OrderByDescending(t => t.Priority),
            "completedat" => query.SortDirection == "asc" ? tasksQuery.OrderBy(t => t.CompletedAt) : tasksQuery.OrderByDescending(t => t.CompletedAt),
            _ => query.SortDirection == "asc" ? tasksQuery.OrderBy(t => t.DueDate) : tasksQuery.OrderByDescending(t => t.DueDate)
        };

        // Get total count
        var totalCount = await tasksQuery.CountAsync();

        // Apply pagination
        var tasks = await tasksQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Map to DTOs
        var taskDtos = tasks.Select(MapToResponseDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new TaskListResponseDto
        {
            Data = taskDtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.PageNumber > 1,
            HasNextPage = query.PageNumber < totalPages
        };
    }

    public async Task<TaskResponseDto?> GetTaskByIdAsync(Guid id)
    {
        var task = await _context.GetTasksForCurrentTenant()
            .Include(t => t.Lead)
            .Include(t => t.AssignedUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        return task != null ? MapToResponseDto(task) : null;
    }

    public async Task<TaskResponseDto> CreateTaskAsync(CreateTaskDto createDto)
    {
        if (!_tenantContext.OrganizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        // Ensure DueDate is in UTC format for PostgreSQL compatibility
        var dueDate = createDto.DueDate.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(createDto.DueDate, DateTimeKind.Utc)
            : createDto.DueDate.ToUniversalTime();

        var task = new Core.Entities.Task
        {
            Id = Guid.NewGuid(),
            Title = createDto.Title,
            Description = createDto.Description,
            Type = createDto.Type,
            Status = "Pending",
            DueDate = dueDate,
            Priority = createDto.Priority,
            Notes = createDto.Notes,
            LeadId = createDto.LeadId,
            AssignedUserId = createDto.AssignedUserId,
            OrganizationId = _tenantContext.OrganizationId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Task {TaskId} created successfully", task.Id);

        return await GetTaskByIdAsync(task.Id) ?? throw new InvalidOperationException("Failed to retrieve created task");
    }

    public async Task<TaskResponseDto?> UpdateTaskAsync(Guid id, UpdateTaskDto updateDto)
    {
        var task = await _context.GetTasksForCurrentTenant()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
        {
            return null;
        }

        task.Title = updateDto.Title;
        task.Description = updateDto.Description;
        task.Type = updateDto.Type;
        task.Status = updateDto.Status;
        task.DueDate = updateDto.DueDate;
        task.CompletedAt = updateDto.CompletedAt;
        task.Priority = updateDto.Priority;
        task.Notes = updateDto.Notes;
        task.DurationMinutes = updateDto.DurationMinutes;
        task.LeadId = updateDto.LeadId;
        task.AssignedUserId = updateDto.AssignedUserId;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Task {TaskId} updated successfully", task.Id);

        return await GetTaskByIdAsync(task.Id);
    }

    public async Task<bool> DeleteTaskAsync(Guid id)
    {
        var task = await _context.GetTasksForCurrentTenant()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
        {
            return false;
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Task {TaskId} deleted successfully", id);

        return true;
    }

    public async Task<List<TaskResponseDto>> GetTasksByLeadIdAsync(Guid leadId)
    {
        var tasks = await _context.GetTasksForCurrentTenant()
            .Where(t => t.LeadId == leadId)
            .Include(t => t.Lead)
            .Include(t => t.AssignedUser)
            .OrderByDescending(t => t.DueDate)
            .ToListAsync();

        return tasks.Select(MapToResponseDto).ToList();
    }

    public async Task<List<TaskResponseDto>> GetMyTasksAsync()
    {
        if (!_tenantContext.UserId.HasValue)
        {
            return new List<TaskResponseDto>();
        }

        var tasks = await _context.GetTasksForCurrentTenant()
            .Where(t => t.AssignedUserId == _tenantContext.UserId.Value)
            .Include(t => t.Lead)
            .Include(t => t.AssignedUser)
            .OrderByDescending(t => t.DueDate)
            .ToListAsync();

        return tasks.Select(MapToResponseDto).ToList();
    }

    public async Task<TaskResponseDto?> CompleteTaskAsync(Guid id, string? notes, int? durationMinutes)
    {
        var task = await _context.GetTasksForCurrentTenant()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
        {
            return null;
        }

        task.Status = "Completed";
        task.CompletedAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(notes))
        {
            task.Notes = notes;
        }
        task.DurationMinutes = durationMinutes;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Task {TaskId} completed successfully", id);

        return await GetTaskByIdAsync(id);
    }

    private static TaskResponseDto MapToResponseDto(Core.Entities.Task task)
    {
        return new TaskResponseDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Type = task.Type,
            Status = task.Status,
            DueDate = task.DueDate,
            CompletedAt = task.CompletedAt,
            Priority = task.Priority,
            Notes = task.Notes,
            DurationMinutes = task.DurationMinutes,
            LeadId = task.LeadId,
            AssignedUserId = task.AssignedUserId,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            LeadTitle = task.Lead?.Title,
            AssignedUserName = task.AssignedUser?.FullName,
            IsOverdue = task.IsOverdue,
            IsCompleted = task.IsCompleted,
            IsToday = task.IsToday
        };
    }
}
