using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for attachment management
/// </summary>
public class AttachmentService : IAttachmentService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AttachmentService> _logger;
    private readonly string _uploadPath;

    public AttachmentService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<AttachmentService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
        
        // Set upload path - in production, this should come from configuration
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        
        // Ensure upload directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<AttachmentListResponseDto> GetAttachmentsAsync(AttachmentQueryDto query)
    {
        _logger.LogInformation("GetAttachmentsAsync called with query parameters");

        var attachmentsQuery = _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .Include(a => a.UploadedByUser)
            .AsQueryable();

        // Apply filters
        if (query.LeadId.HasValue)
        {
            attachmentsQuery = attachmentsQuery.Where(a => a.LeadId == query.LeadId.Value);
        }

        if (query.TaskId.HasValue)
        {
            attachmentsQuery = attachmentsQuery.Where(a => a.TaskId == query.TaskId.Value);
        }

        if (query.ActivityId.HasValue)
        {
            attachmentsQuery = attachmentsQuery.Where(a => a.ActivityId == query.ActivityId.Value);
        }

        if (query.CommentId.HasValue)
        {
            attachmentsQuery = attachmentsQuery.Where(a => a.CommentId == query.CommentId.Value);
        }

        if (query.UploadedByUserId.HasValue)
        {
            attachmentsQuery = attachmentsQuery.Where(a => a.UploadedByUserId == query.UploadedByUserId.Value);
        }

        if (!string.IsNullOrEmpty(query.ContentType))
        {
            attachmentsQuery = attachmentsQuery.Where(a => a.ContentType.Contains(query.ContentType));
        }

        // Apply sorting
        attachmentsQuery = query.SortBy?.ToLower() switch
        {
            "filename" => query.SortDirection == "asc" ? attachmentsQuery.OrderBy(a => a.FileName) : attachmentsQuery.OrderByDescending(a => a.FileName),
            "filesize" => query.SortDirection == "asc" ? attachmentsQuery.OrderBy(a => a.FileSize) : attachmentsQuery.OrderByDescending(a => a.FileSize),
            "contenttype" => query.SortDirection == "asc" ? attachmentsQuery.OrderBy(a => a.ContentType) : attachmentsQuery.OrderByDescending(a => a.ContentType),
            _ => query.SortDirection == "asc" ? attachmentsQuery.OrderBy(a => a.CreatedAt) : attachmentsQuery.OrderByDescending(a => a.CreatedAt)
        };

        // Get total count
        var totalCount = await attachmentsQuery.CountAsync();

        // Apply pagination
        var attachments = await attachmentsQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Map to DTOs
        var attachmentDtos = attachments.Select(MapToResponseDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new AttachmentListResponseDto
        {
            Data = attachmentDtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.PageNumber > 1,
            HasNextPage = query.PageNumber < totalPages
        };
    }

    public async Task<AttachmentResponseDto?> GetAttachmentByIdAsync(Guid id)
    {
        var attachment = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .Include(a => a.UploadedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        return attachment != null ? MapToResponseDto(attachment) : null;
    }

    public async Task<AttachmentResponseDto> UploadAttachmentAsync(FileUploadDto file, CreateAttachmentDto createDto)
    {
        if (!_tenantContext.OrganizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        if (!_tenantContext.UserId.HasValue)
        {
            throw new InvalidOperationException("User context is not available");
        }

        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File is required");
        }

        // Validate file size (max 10MB)
        const long maxFileSize = 10 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            throw new ArgumentException("File size exceeds maximum allowed size of 10MB");
        }

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var organizationFolder = Path.Combine(_uploadPath, _tenantContext.OrganizationId.Value.ToString());
        
        // Ensure organization folder exists
        if (!Directory.Exists(organizationFolder))
        {
            Directory.CreateDirectory(organizationFolder);
        }

        var filePath = Path.Combine(organizationFolder, uniqueFileName);

        // Save file to disk
        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.Stream.CopyToAsync(fileStream);
        }

        // Create attachment entity
        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            FileName = uniqueFileName,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            FilePath = filePath,
            Description = createDto.Description,
            LeadId = createDto.LeadId,
            TaskId = createDto.TaskId,
            ActivityId = createDto.ActivityId,
            CommentId = createDto.CommentId,
            UploadedByUserId = _tenantContext.UserId.Value,
            OrganizationId = _tenantContext.OrganizationId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Attachment {AttachmentId} uploaded successfully", attachment.Id);

        return await GetAttachmentByIdAsync(attachment.Id) ?? throw new InvalidOperationException("Failed to retrieve uploaded attachment");
    }

    public async Task<AttachmentResponseDto?> UpdateAttachmentAsync(Guid id, UpdateAttachmentDto updateDto)
    {
        var attachment = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attachment == null)
        {
            return null;
        }

        attachment.Description = updateDto.Description;
        attachment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Attachment {AttachmentId} updated successfully", id);

        return await GetAttachmentByIdAsync(id);
    }

    public async Task<bool> DeleteAttachmentAsync(Guid id)
    {
        var attachment = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attachment == null)
        {
            return false;
        }

        // Delete physical file
        if (File.Exists(attachment.FilePath))
        {
            try
            {
                File.Delete(attachment.FilePath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete physical file for attachment {AttachmentId}", id);
            }
        }

        _context.Attachments.Remove(attachment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Attachment {AttachmentId} deleted successfully", id);

        return true;
    }

    public async Task<List<AttachmentResponseDto>> GetAttachmentsByLeadIdAsync(Guid leadId)
    {
        var attachments = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId && a.LeadId == leadId)
            .Include(a => a.UploadedByUser)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return attachments.Select(MapToResponseDto).ToList();
    }

    public async Task<List<AttachmentResponseDto>> GetAttachmentsByTaskIdAsync(Guid taskId)
    {
        var attachments = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId && a.TaskId == taskId)
            .Include(a => a.UploadedByUser)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return attachments.Select(MapToResponseDto).ToList();
    }

    public async Task<List<AttachmentResponseDto>> GetAttachmentsByActivityIdAsync(Guid activityId)
    {
        var attachments = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId && a.ActivityId == activityId)
            .Include(a => a.UploadedByUser)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return attachments.Select(MapToResponseDto).ToList();
    }

    public async Task<List<AttachmentResponseDto>> GetAttachmentsByCommentIdAsync(Guid commentId)
    {
        var attachments = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId && a.CommentId == commentId)
            .Include(a => a.UploadedByUser)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return attachments.Select(MapToResponseDto).ToList();
    }

    public async Task<(Stream stream, string contentType, string fileName)?> GetAttachmentFileAsync(Guid id)
    {
        var attachment = await _context.Attachments
            .Where(a => a.OrganizationId == _tenantContext.OrganizationId)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attachment == null || !File.Exists(attachment.FilePath))
        {
            return null;
        }

        var stream = new FileStream(attachment.FilePath, FileMode.Open, FileAccess.Read);
        return (stream, attachment.ContentType, attachment.OriginalFileName);
    }

    private static AttachmentResponseDto MapToResponseDto(Attachment attachment)
    {
        return new AttachmentResponseDto
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            OriginalFileName = attachment.OriginalFileName,
            ContentType = attachment.ContentType,
            FileSize = attachment.FileSize,
            FileSizeFormatted = attachment.FileSizeFormatted,
            FilePath = attachment.FilePath,
            ThumbnailPath = attachment.ThumbnailPath,
            Description = attachment.Description,
            LeadId = attachment.LeadId,
            TaskId = attachment.TaskId,
            ActivityId = attachment.ActivityId,
            CommentId = attachment.CommentId,
            UploadedByUserId = attachment.UploadedByUserId,
            CreatedAt = attachment.CreatedAt,
            UpdatedAt = attachment.UpdatedAt,
            UploadedByUserName = attachment.UploadedByUser?.FullName,
            IsImage = attachment.IsImage,
            IsDocument = attachment.IsDocument
        };
    }
}

