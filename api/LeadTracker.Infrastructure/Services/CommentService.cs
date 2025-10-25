using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for comment management
/// </summary>
public class CommentService : ICommentService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<CommentService> _logger;

    public CommentService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<CommentService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<CommentListResponseDto> GetCommentsAsync(CommentQueryDto query)
    {
        _logger.LogInformation("GetCommentsAsync called with query parameters");

        var commentsQuery = _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId)
            .Include(c => c.User)
            .Include(c => c.ParentComment)
            .AsQueryable();

        // Apply filters
        if (query.LeadId.HasValue)
        {
            commentsQuery = commentsQuery.Where(c => c.LeadId == query.LeadId.Value);
        }

        if (query.TaskId.HasValue)
        {
            commentsQuery = commentsQuery.Where(c => c.TaskId == query.TaskId.Value);
        }

        if (query.ActivityId.HasValue)
        {
            commentsQuery = commentsQuery.Where(c => c.ActivityId == query.ActivityId.Value);
        }

        if (query.UserId.HasValue)
        {
            commentsQuery = commentsQuery.Where(c => c.UserId == query.UserId.Value);
        }

        // Only get top-level comments (not replies)
        commentsQuery = commentsQuery.Where(c => c.ParentCommentId == null);

        // Apply sorting
        commentsQuery = query.SortBy?.ToLower() switch
        {
            "content" => query.SortDirection == "asc" ? commentsQuery.OrderBy(c => c.Content) : commentsQuery.OrderByDescending(c => c.Content),
            _ => query.SortDirection == "asc" ? commentsQuery.OrderBy(c => c.CreatedAt) : commentsQuery.OrderByDescending(c => c.CreatedAt)
        };

        // Get total count
        var totalCount = await commentsQuery.CountAsync();

        // Apply pagination
        var comments = await commentsQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Load replies for each comment
        var commentIds = comments.Select(c => c.Id).ToList();
        var replies = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId && c.ParentCommentId != null && commentIds.Contains(c.ParentCommentId.Value))
            .Include(c => c.User)
            .ToListAsync();

        // Map to DTOs
        var commentDtos = comments.Select(c => MapToResponseDto(c, replies)).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new CommentListResponseDto
        {
            Data = commentDtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.PageNumber > 1,
            HasNextPage = query.PageNumber < totalPages
        };
    }

    public async Task<CommentResponseDto?> GetCommentByIdAsync(Guid id)
    {
        var comment = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId)
            .Include(c => c.User)
            .Include(c => c.ParentComment)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null)
        {
            return null;
        }

        return MapToResponseDto(comment, comment.Replies.ToList());
    }

    public async Task<CommentResponseDto> CreateCommentAsync(CreateCommentDto createDto)
    {
        if (!_tenantContext.OrganizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        if (!_tenantContext.UserId.HasValue)
        {
            throw new InvalidOperationException("User context is not available");
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = createDto.Content,
            LeadId = createDto.LeadId,
            TaskId = createDto.TaskId,
            ActivityId = createDto.ActivityId,
            ParentCommentId = createDto.ParentCommentId,
            UserId = _tenantContext.UserId.Value,
            OrganizationId = _tenantContext.OrganizationId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Comment {CommentId} created successfully", comment.Id);

        return await GetCommentByIdAsync(comment.Id) ?? throw new InvalidOperationException("Failed to retrieve created comment");
    }

    public async Task<CommentResponseDto?> UpdateCommentAsync(Guid id, UpdateCommentDto updateDto)
    {
        var comment = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null)
        {
            return null;
        }

        // Check if user owns the comment
        if (comment.UserId != _tenantContext.UserId)
        {
            throw new UnauthorizedAccessException("You can only edit your own comments");
        }

        comment.Content = updateDto.Content;
        comment.EditedAt = DateTime.UtcNow;
        comment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Comment {CommentId} updated successfully", id);

        return await GetCommentByIdAsync(id);
    }

    public async Task<bool> DeleteCommentAsync(Guid id)
    {
        var comment = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null)
        {
            return false;
        }

        // Check if user owns the comment
        if (comment.UserId != _tenantContext.UserId)
        {
            throw new UnauthorizedAccessException("You can only delete your own comments");
        }

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Comment {CommentId} deleted successfully", id);

        return true;
    }

    public async Task<List<CommentResponseDto>> GetCommentsByLeadIdAsync(Guid leadId)
    {
        var comments = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId && c.LeadId == leadId && c.ParentCommentId == null)
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => MapToResponseDto(c, c.Replies.ToList())).ToList();
    }

    public async Task<List<CommentResponseDto>> GetCommentsByTaskIdAsync(Guid taskId)
    {
        var comments = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId && c.TaskId == taskId && c.ParentCommentId == null)
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => MapToResponseDto(c, c.Replies.ToList())).ToList();
    }

    public async Task<List<CommentResponseDto>> GetCommentsByActivityIdAsync(Guid activityId)
    {
        var comments = await _context.Comments
            .Where(c => c.OrganizationId == _tenantContext.OrganizationId && c.ActivityId == activityId && c.ParentCommentId == null)
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => MapToResponseDto(c, c.Replies.ToList())).ToList();
    }

    private static CommentResponseDto MapToResponseDto(Comment comment, List<Comment> allReplies)
    {
        var replies = allReplies
            .Where(r => r.ParentCommentId == comment.Id)
            .Select(r => new CommentResponseDto
            {
                Id = r.Id,
                Content = r.Content,
                EditedAt = r.EditedAt,
                LeadId = r.LeadId,
                TaskId = r.TaskId,
                ActivityId = r.ActivityId,
                ParentCommentId = r.ParentCommentId,
                UserId = r.UserId,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                UserName = r.User?.FullName,
                IsEdited = r.IsEdited,
                IsReply = r.IsReply,
                Replies = new List<CommentResponseDto>()
            })
            .ToList();

        return new CommentResponseDto
        {
            Id = comment.Id,
            Content = comment.Content,
            EditedAt = comment.EditedAt,
            LeadId = comment.LeadId,
            TaskId = comment.TaskId,
            ActivityId = comment.ActivityId,
            ParentCommentId = comment.ParentCommentId,
            UserId = comment.UserId,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            UserName = comment.User?.FullName,
            IsEdited = comment.IsEdited,
            IsReply = comment.IsReply,
            Replies = replies
        };
    }
}

