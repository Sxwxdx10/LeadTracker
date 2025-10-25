using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// Attachment entity - represents files attached to leads, tasks, activities, or comments
/// </summary>
public class Attachment : TenantEntity
{
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty; // MIME type
    
    [Required]
    public long FileSize { get; set; } // Size in bytes
    
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty; // Storage path or URL
    
    [MaxLength(500)]
    public string? ThumbnailPath { get; set; } // For images
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    // Foreign Keys - can be linked to different entities
    public Guid? LeadId { get; set; }
    
    public Guid? TaskId { get; set; }
    
    public Guid? ActivityId { get; set; }
    
    public Guid? CommentId { get; set; }
    
    [Required]
    public Guid UploadedByUserId { get; set; }
    
    // Navigation properties
    public virtual Lead? Lead { get; set; }
    public virtual Task? Task { get; set; }
    public virtual Activity? Activity { get; set; }
    public virtual Comment? Comment { get; set; }
    public virtual User UploadedByUser { get; set; } = null!;
    
    // Computed properties
    public string FileSizeFormatted
    {
        get
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = FileSize;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
    
    public bool IsImage => ContentType.StartsWith("image/");
    public bool IsDocument => ContentType.Contains("pdf") || ContentType.Contains("document") || ContentType.Contains("text");
}

