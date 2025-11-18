using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.Entities;

/// <summary>
/// ImportHistory entity - tracks all import operations
/// </summary>
public class ImportHistory : TenantEntity
{
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    public ImportSource Source { get; set; }
    
    public int TotalRows { get; set; }
    
    public int SuccessCount { get; set; }
    
    public int ErrorCount { get; set; }
    
    public int DuplicateCount { get; set; }
    
    public int SkippedCount { get; set; }
    
    /// <summary>
    /// JSON serialized error details
    /// </summary>
    public string? ErrorDetails { get; set; }
    
    /// <summary>
    /// JSON serialized mapping configuration
    /// </summary>
    public string? MappingConfiguration { get; set; }
    
    [Required]
    public Guid ImportedByUserId { get; set; }
    
    public DateTime ImportedAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    /// <summary>
    /// Import duration in milliseconds
    /// </summary>
    public long? DurationMs { get; set; }
    
    public ImportStatus Status { get; set; }
    
    // Navigation properties
    public virtual User ImportedByUser { get; set; } = null!;
}

/// <summary>
/// Source of the import
/// </summary>
public enum ImportSource
{
    CSV = 1,
    Excel = 2,
    GoogleSheets = 3,
    Screenshot = 4,
    Manual = 5
}

/// <summary>
/// Status of the import operation
/// </summary>
public enum ImportStatus
{
    Pending = 1,
    Processing = 2,
    Completed = 3,
    Failed = 4,
    PartiallyCompleted = 5
}

