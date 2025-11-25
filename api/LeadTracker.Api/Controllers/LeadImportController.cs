using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for importing leads from various sources
/// </summary>
[ApiController]
[Route("api/lead-import")]
[Authorize]
public class LeadImportController : ControllerBase
{
    private readonly ILeadImportService _importService;
    private readonly ILogger<LeadImportController> _logger;

    public LeadImportController(
        ILeadImportService importService,
        ILogger<LeadImportController> logger)
    {
        _importService = importService;
        _logger = logger;
    }

    /// <summary>
    /// Preview CSV import data before actual import
    /// </summary>
    /// <param name="file">CSV file to preview</param>
    /// <param name="delimiter">CSV delimiter (default: comma)</param>
    /// <param name="skipFirstRow">Skip header row (default: true)</param>
    /// <returns>Import preview with validation results</returns>
    [HttpPost("csv/preview")]
    [ProducesResponseType(typeof(ImportPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PreviewCsvImport(
        [FromForm] IFormFile file,
        [FromForm] string? delimiter = ",",
        [FromForm] bool skipFirstRow = true,
        [FromForm] string? mappingJson = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File is required" });
            }

            if (file.Length > 50 * 1024 * 1024) // 50MB limit
            {
                return BadRequest(new { message = "File size exceeds 50MB limit" });
            }

            CsvMappingDto mapping;
            if (!string.IsNullOrWhiteSpace(mappingJson))
            {
                mapping = System.Text.Json.JsonSerializer.Deserialize<CsvMappingDto>(mappingJson) 
                          ?? new CsvMappingDto
                          {
                              Delimiter = delimiter ?? ",",
                              SkipFirstRow = skipFirstRow,
                              ColumnMapping = new Dictionary<string, string>()
                          };
                
                // Ensure delimiter and skipFirstRow are set
                if (string.IsNullOrEmpty(mapping.Delimiter))
                    mapping.Delimiter = delimiter ?? ",";
            }
            else
            {
                mapping = new CsvMappingDto
                {
                    Delimiter = delimiter ?? ",",
                    SkipFirstRow = skipFirstRow,
                    ColumnMapping = new Dictionary<string, string>() // Will be auto-detected
                };
            }

            using var stream = file.OpenReadStream();
            var preview = await _importService.PreviewCsvImportAsync(stream, file.FileName, mapping);
            
            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing CSV import");
            return StatusCode(500, new { message = "An error occurred while previewing the file", error = ex.Message });
        }
    }

    /// <summary>
    /// Import leads from CSV file
    /// </summary>
    /// <param name="file">CSV file to import</param>
    /// <param name="mapping">Column mapping configuration (JSON)</param>
    /// <returns>Import result with success/error counts</returns>
    [HttpPost("csv")]
    [ProducesResponseType(typeof(ImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ImportFromCsv(
        [FromForm] IFormFile file,
        [FromForm] string? mappingJson = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File is required" });
            }

            if (file.Length > 50 * 1024 * 1024) // 50MB limit
            {
                return BadRequest(new { message = "File size exceeds 50MB limit" });
            }

            CsvMappingDto mapping;
            if (!string.IsNullOrWhiteSpace(mappingJson))
            {
                mapping = System.Text.Json.JsonSerializer.Deserialize<CsvMappingDto>(mappingJson) 
                          ?? new CsvMappingDto();
            }
            else
            {
                mapping = new CsvMappingDto
                {
                    SkipFirstRow = true,
                    Delimiter = ",",
                    ColumnMapping = new Dictionary<string, string>
                    {
                        // Default mappings - will auto-detect from headers
                        ["FirstName"] = "FirstName",
                        ["LastName"] = "LastName",
                        ["Email"] = "Email",
                        ["Phone"] = "PhoneNumber",
                        ["Company"] = "Company",
                        ["Title"] = "JobTitle"
                    }
                };
            }

            using var stream = file.OpenReadStream();
            var result = await _importService.ImportFromCsvAsync(stream, file.FileName, mapping);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing from CSV");
            
            // Extract detailed error information
            var errorMessage = ex.Message;
            if (ex.InnerException != null)
            {
                errorMessage += $" | Inner: {ex.InnerException.Message}";
            }
            
            // Check for DbUpdateException
            if (ex is Microsoft.EntityFrameworkCore.DbUpdateException dbEx && dbEx.InnerException != null)
            {
                errorMessage = $"Erreur de base de données: {dbEx.InnerException.Message}";
            }
            
            return StatusCode(500, new { message = "An error occurred while importing leads", error = errorMessage });
        }
    }

    /// <summary>
    /// Preview Google Sheets import data
    /// </summary>
    /// <param name="request">Google Sheets import configuration</param>
    /// <returns>Import preview with validation results</returns>
    [HttpPost("google-sheets/preview")]
    [ProducesResponseType(typeof(ImportPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PreviewGoogleSheetsImport([FromBody] GoogleSheetsImportRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var preview = await _importService.PreviewGoogleSheetsImportAsync(request.SheetUrl, request.Mapping);
            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing Google Sheets import");
            return StatusCode(500, new { message = "An error occurred while accessing Google Sheets", error = ex.Message });
        }
    }

    /// <summary>
    /// Import leads from Google Sheets
    /// </summary>
    /// <param name="request">Google Sheets import configuration</param>
    /// <returns>Import result with success/error counts</returns>
    [HttpPost("google-sheets")]
    [ProducesResponseType(typeof(ImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ImportFromGoogleSheets([FromBody] GoogleSheetsImportRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.PreviewOnly)
            {
                var preview = await _importService.PreviewGoogleSheetsImportAsync(request.SheetUrl, request.Mapping);
                return Ok(preview);
            }

            var result = await _importService.ImportFromGoogleSheetsAsync(request.SheetUrl, request.Mapping);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing from Google Sheets");
            return StatusCode(500, new { message = "An error occurred while importing from Google Sheets", error = ex.Message });
        }
    }

    /// <summary>
    /// Extract lead information from screenshot using OCR (client-side)
    /// Note: Server-side OCR is not implemented. Use client-side Tesseract.js instead.
    /// </summary>
    /// <param name="file">Screenshot image file</param>
    /// <returns>Extracted lead information</returns>
    [HttpPost("screenshot/extract")]
    [ProducesResponseType(typeof(ExtractedLeadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public async Task<IActionResult> ExtractFromScreenshot([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Image file is required" });
            }

            if (!file.ContentType.StartsWith("image/"))
            {
                return BadRequest(new { message = "File must be an image" });
            }

            if (file.Length > 10 * 1024 * 1024) // 10MB limit for images
            {
                return BadRequest(new { message = "Image size exceeds 10MB limit" });
            }

            using var stream = file.OpenReadStream();
            var extracted = await _importService.ExtractFromScreenshotAsync(stream, file.FileName);
            
            // Server-side OCR not implemented - return placeholder
            return StatusCode(501, new 
            { 
                message = "Server-side OCR not implemented. Please use client-side Tesseract.js for screenshot extraction.",
                extracted
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting from screenshot");
            return StatusCode(500, new { message = "An error occurred while processing the image", error = ex.Message });
        }
    }

    /// <summary>
    /// Batch create multiple leads
    /// </summary>
    /// <param name="request">Batch create request with list of leads</param>
    /// <returns>Import result with success/error counts</returns>
    [HttpPost("batch")]
    [ProducesResponseType(typeof(ImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BatchCreateLeads([FromBody] BatchCreateLeadsRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.Leads == null || !request.Leads.Any())
            {
                return BadRequest(new { message = "At least one lead is required" });
            }

            if (request.Leads.Count > 1000)
            {
                return BadRequest(new { message = "Maximum 1000 leads per batch" });
            }

            var result = await _importService.BatchCreateLeadsAsync(
                request.Leads, 
                request.SkipDuplicates, 
                request.DefaultStageId);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch creating leads");
            return StatusCode(500, new { message = "An error occurred while creating leads", error = ex.Message });
        }
    }

    /// <summary>
    /// Get import history for current organization
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20)</param>
    /// <returns>List of import history entries</returns>
    [HttpGet("history")]
    [ProducesResponseType(typeof(List<ImportHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetImportHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var history = await _importService.GetImportHistoryAsync(page, pageSize);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving import history");
            return StatusCode(500, new { message = "An error occurred while retrieving import history", error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific import history by ID
    /// </summary>
    /// <param name="id">Import history ID</param>
    /// <returns>Import history details</returns>
    [HttpGet("history/{id}")]
    [ProducesResponseType(typeof(ImportHistoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetImportHistoryById(Guid id)
    {
        try
        {
            var history = await _importService.GetImportHistoryByIdAsync(id);
            
            if (history == null)
            {
                return NotFound(new { message = "Import history not found" });
            }
            
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving import history {ImportId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving import history", error = ex.Message });
        }
    }
}

