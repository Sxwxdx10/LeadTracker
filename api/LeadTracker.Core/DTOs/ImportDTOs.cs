using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for preview of import data before actual import
/// </summary>
public class ImportPreviewDto
{
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public List<ImportRowDto> PreviewRows { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public Dictionary<string, int> ColumnMapping { get; set; } = new();
}

/// <summary>
/// Individual row in import preview
/// </summary>
public class ImportRowDto
{
    public int RowNumber { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public string? Title { get; set; }
    public decimal? EstimatedValue { get; set; }
    public int? Probability { get; set; }
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public bool IsValid { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}

/// <summary>
/// Result of import operation
/// </summary>
public class ImportResultDto
{
    public Guid ImportId { get; set; }
    public int TotalProcessed { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public int DuplicateCount { get; set; }
    public int SkippedCount { get; set; }
    public List<ImportErrorDto> Errors { get; set; } = new();
    public List<Guid> CreatedLeadIds { get; set; } = new();
    public DateTime ImportedAt { get; set; }
}

/// <summary>
/// Individual error during import
/// </summary>
public class ImportErrorDto
{
    public int RowNumber { get; set; }
    public string Error { get; set; } = string.Empty;
    public Dictionary<string, string> RowData { get; set; } = new();
}

/// <summary>
/// CSV column mapping configuration
/// </summary>
public class CsvMappingDto
{
    /// <summary>
    /// Maps CSV column names to Lead entity property names
    /// Key: CSV column name, Value: Lead property name
    /// </summary>
    public Dictionary<string, string> ColumnMapping { get; set; } = new();
    
    public bool SkipFirstRow { get; set; } = true;
    
    [MaxLength(5)]
    public string Delimiter { get; set; } = ",";
    
    public string? Encoding { get; set; } = "UTF-8";
    
    public Guid? DefaultStageId { get; set; }
    
    public bool SkipDuplicates { get; set; } = true;
}

/// <summary>
/// Google Sheets mapping configuration
/// </summary>
public class SheetMappingDto
{
    [Required]
    [Url]
    public string SheetUrl { get; set; } = string.Empty;
    
    public string? SheetName { get; set; }
    
    public string? Range { get; set; } // e.g., "A1:F100"
    
    public Dictionary<string, string> ColumnMapping { get; set; } = new();
    
    public bool SkipFirstRow { get; set; } = true;
    
    public Guid? DefaultStageId { get; set; }
    
    public bool SkipDuplicates { get; set; } = true;
}

/// <summary>
/// Extracted lead data from screenshot OCR
/// </summary>
public class ExtractedLeadDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public string? Address { get; set; }
    public string? Website { get; set; }
    
    /// <summary>
    /// OCR confidence score (0-1)
    /// </summary>
    public float Confidence { get; set; }
    
    /// <summary>
    /// Raw extracted text
    /// </summary>
    public string? RawText { get; set; }
    
    /// <summary>
    /// Confidence per field
    /// </summary>
    public Dictionary<string, float> FieldConfidence { get; set; } = new();
}

/// <summary>
/// Request to extract lead from screenshot (used in service layer)
/// </summary>
public class ScreenshotImportRequest
{
    [Required]
    public Stream ImageStream { get; set; } = null!;
    
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    public string ContentType { get; set; } = "image/jpeg";
    
    public bool AutoCreate { get; set; } = false;
    
    public Guid? DefaultStageId { get; set; }
}

/// <summary>
/// Import history entry response
/// </summary>
public class ImportHistoryDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public int DuplicateCount { get; set; }
    public string? ErrorDetails { get; set; }
    public Guid ImportedByUserId { get; set; }
    public string? ImportedByUserName { get; set; }
    public DateTime ImportedAt { get; set; }
    public TimeSpan Duration { get; set; }
}

/// <summary>
/// Request to import from Google Sheets
/// </summary>
public class GoogleSheetsImportRequest
{
    [Required]
    [Url]
    public string SheetUrl { get; set; } = string.Empty;
    
    public SheetMappingDto Mapping { get; set; } = new();
    
    public bool PreviewOnly { get; set; } = false;
}

/// <summary>
/// Request to import from CSV (used in service layer)
/// </summary>
public class CsvImportRequest
{
    [Required]
    public Stream FileStream { get; set; } = null!;
    
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    public CsvMappingDto Mapping { get; set; } = new();
    
    public bool PreviewOnly { get; set; } = false;
}

/// <summary>
/// Batch create leads request
/// </summary>
public class BatchCreateLeadsRequest
{
    [Required]
    [MinLength(1)]
    public List<CreateLeadDto> Leads { get; set; } = new();
    
    public bool SkipDuplicates { get; set; } = true;
    
    public Guid? DefaultStageId { get; set; }
}

