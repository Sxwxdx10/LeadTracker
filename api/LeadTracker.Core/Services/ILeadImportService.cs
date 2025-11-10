using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for importing leads from various sources
/// </summary>
public interface ILeadImportService
{
    /// <summary>
    /// Preview CSV import data before actual import
    /// </summary>
    Task<ImportPreviewDto> PreviewCsvImportAsync(Stream fileStream, string fileName, CsvMappingDto mapping);
    
    /// <summary>
    /// Import leads from CSV file
    /// </summary>
    Task<ImportResultDto> ImportFromCsvAsync(Stream fileStream, string fileName, CsvMappingDto mapping);
    
    /// <summary>
    /// Preview Google Sheets import data before actual import
    /// </summary>
    Task<ImportPreviewDto> PreviewGoogleSheetsImportAsync(string sheetUrl, SheetMappingDto mapping);
    
    /// <summary>
    /// Import leads from Google Sheets
    /// </summary>
    Task<ImportResultDto> ImportFromGoogleSheetsAsync(string sheetUrl, SheetMappingDto mapping);
    
    /// <summary>
    /// Extract lead information from screenshot using OCR
    /// </summary>
    Task<ExtractedLeadDto> ExtractFromScreenshotAsync(Stream imageStream, string fileName);
    
    /// <summary>
    /// Create lead from extracted screenshot data
    /// </summary>
    Task<ImportResultDto> ImportFromScreenshotAsync(Stream imageStream, string fileName, Guid? defaultStageId);
    
    /// <summary>
    /// Batch create multiple leads
    /// </summary>
    Task<ImportResultDto> BatchCreateLeadsAsync(List<CreateLeadDto> leads, bool skipDuplicates, Guid? defaultStageId);
    
    /// <summary>
    /// Get import history for current organization
    /// </summary>
    Task<List<ImportHistoryDto>> GetImportHistoryAsync(int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Get specific import history by ID
    /// </summary>
    Task<ImportHistoryDto?> GetImportHistoryByIdAsync(Guid id);
}

