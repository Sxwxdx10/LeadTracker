using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using CsvHelper;
using CsvHelper.Configuration;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LeadTracker.Infrastructure.Services;

public class LeadImportService : ILeadImportService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILeadService _leadService;
    private readonly ILogger<LeadImportService> _logger;

    public LeadImportService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILeadService leadService,
        ILogger<LeadImportService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _leadService = leadService;
        _logger = logger;
    }

    public async Task<ImportPreviewDto> PreviewCsvImportAsync(Stream fileStream, string fileName, CsvMappingDto mapping)
    {
        var preview = new ImportPreviewDto();
        
        try
        {
            var rows = await ParseCsvFileAsync(fileStream, mapping);
            preview.TotalRows = rows.Count;
            
            // Validate and convert rows
            var validRows = new List<ImportRowDto>();
            foreach (var (row, index) in rows.Select((r, i) => (r, i)))
            {
                var importRow = MapToImportRow(row, index + (mapping.SkipFirstRow ? 2 : 1), mapping);
                validRows.Add(importRow);
                
                if (importRow.IsValid)
                {
                    preview.ValidRows++;
                }
                else
                {
                    preview.Errors.AddRange(importRow.ValidationErrors);
                }
            }
            
            // Return first 10 rows for preview
            preview.PreviewRows = validRows.Take(10).ToList();
            
            // Check for potential duplicates
            if (validRows.Any())
            {
                var emails = validRows
                    .Where(r => !string.IsNullOrWhiteSpace(r.Email))
                    .Select(r => r.Email!)
                    .Distinct()
                    .ToList();
                
                var existingEmails = await _context.Leads
                    .Where(l => emails.Contains(l.Email))
                    .Select(l => l.Email)
                    .ToListAsync();
                
                if (existingEmails.Any())
                {
                    preview.Warnings.Add($"{existingEmails.Count} potential duplicate(s) found based on email");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing CSV import");
            preview.Errors.Add($"Error parsing file: {ex.Message}");
        }
        
        return preview;
    }

    public async Task<ImportResultDto> ImportFromCsvAsync(Stream fileStream, string fileName, CsvMappingDto mapping)
    {
        var startTime = DateTime.UtcNow;
        var result = new ImportResultDto
        {
            ImportId = Guid.NewGuid(),
            ImportedAt = startTime
        };
        
        var importHistory = new ImportHistory
        {
            Id = result.ImportId,
            FileName = fileName,
            Source = ImportSource.CSV,
            Status = ImportStatus.Processing,
            ImportedAt = startTime,
            ImportedByUserId = _tenantContext.UserId!.Value,
            OrganizationId = _tenantContext.OrganizationId!.Value,
            MappingConfiguration = JsonSerializer.Serialize(mapping),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.ImportHistories.Add(importHistory);
        await _context.SaveChangesAsync();
        
        try
        {
            var rows = await ParseCsvFileAsync(fileStream, mapping);
            result.TotalProcessed = rows.Count;
            importHistory.TotalRows = rows.Count;
            
            // Get default stage if not specified
            Guid? defaultStageId = mapping.DefaultStageId;
            if (defaultStageId == null)
            {
                var defaultStage = await _context.Stages
                    .OrderBy(s => s.Order)
                    .FirstOrDefaultAsync();
                
                defaultStageId = defaultStage?.Id;
                
                if (defaultStageId == null)
                {
                    throw new InvalidOperationException("No stages found. Please create at least one stage before importing leads.");
                }
            }
            
            // Process each row
            foreach (var (row, index) in rows.Select((r, i) => (r, i)))
            {
                var rowNumber = index + (mapping.SkipFirstRow ? 2 : 1);
                
                try
                {
                    var importRow = MapToImportRow(row, rowNumber, mapping);
                    
                    if (!importRow.IsValid)
                    {
                        result.ErrorCount++;
                        result.Errors.Add(new ImportErrorDto
                        {
                            RowNumber = rowNumber,
                            Error = string.Join("; ", importRow.ValidationErrors),
                            RowData = row
                        });
                        continue;
                    }
                    
                    // Check for duplicates
                    if (mapping.SkipDuplicates && !string.IsNullOrWhiteSpace(importRow.Email))
                    {
                        var exists = await _context.Leads
                            .AnyAsync(l => l.Email == importRow.Email);
                        
                        if (exists)
                        {
                            result.DuplicateCount++;
                            continue;
                        }
                    }
                    
                    // Create lead
                    var createDto = new CreateLeadDto
                    {
                        Title = importRow.Title ?? $"{importRow.FirstName} {importRow.LastName} - {importRow.Company}",
                        FirstName = importRow.FirstName!,
                        LastName = importRow.LastName!,
                        Email = importRow.Email!,
                        PhoneNumber = importRow.PhoneNumber,
                        Company = importRow.Company,
                        JobTitle = importRow.JobTitle,
                        EstimatedValue = importRow.EstimatedValue,
                        Probability = importRow.Probability ?? 50,
                        Source = importRow.Source ?? "CSV Import",
                        Notes = importRow.Notes,
                        StageId = defaultStageId.Value
                    };
                    
                    var createdLead = await _leadService.CreateLeadAsync(createDto);
                    result.SuccessCount++;
                    result.CreatedLeadIds.Add(createdLead.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error importing row {RowNumber}", rowNumber);
                    result.ErrorCount++;
                    result.Errors.Add(new ImportErrorDto
                    {
                        RowNumber = rowNumber,
                        Error = ex.Message,
                        RowData = row
                    });
                }
            }
            
            // Update import history
            importHistory.SuccessCount = result.SuccessCount;
            importHistory.ErrorCount = result.ErrorCount;
            importHistory.DuplicateCount = result.DuplicateCount;
            importHistory.CompletedAt = DateTime.UtcNow;
            importHistory.DurationMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;
            importHistory.Status = result.ErrorCount == 0 ? ImportStatus.Completed : 
                                   result.SuccessCount > 0 ? ImportStatus.PartiallyCompleted : 
                                   ImportStatus.Failed;
            
            if (result.Errors.Any())
            {
                importHistory.ErrorDetails = JsonSerializer.Serialize(result.Errors.Take(100));
            }
            
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Critical error during CSV import");
            importHistory.Status = ImportStatus.Failed;
            importHistory.ErrorCount = result.TotalProcessed - result.SuccessCount;
            importHistory.ErrorDetails = ex.Message;
            importHistory.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            throw;
        }
        
        return result;
    }

    public async Task<ImportPreviewDto> PreviewGoogleSheetsImportAsync(string sheetUrl, SheetMappingDto mapping)
    {
        var preview = new ImportPreviewDto();
        
        try
        {
            // Convert Google Sheets URL to CSV export URL
            var csvUrl = ConvertToGoogleSheetsCsvUrl(sheetUrl);
            
            using var httpClient = new HttpClient();
            using var response = await httpClient.GetAsync(csvUrl);
            response.EnsureSuccessStatusCode();
            
            using var stream = await response.Content.ReadAsStreamAsync();
            
            // Use CSV preview logic
            var csvMapping = new CsvMappingDto
            {
                ColumnMapping = mapping.ColumnMapping,
                SkipFirstRow = mapping.SkipFirstRow,
                Delimiter = ",",
                DefaultStageId = mapping.DefaultStageId,
                SkipDuplicates = mapping.SkipDuplicates
            };
            
            preview = await PreviewCsvImportAsync(stream, "GoogleSheets", csvMapping);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing Google Sheets import");
            preview.Errors.Add($"Error accessing Google Sheets: {ex.Message}");
        }
        
        return preview;
    }

    public async Task<ImportResultDto> ImportFromGoogleSheetsAsync(string sheetUrl, SheetMappingDto mapping)
    {
        try
        {
            // Convert Google Sheets URL to CSV export URL
            var csvUrl = ConvertToGoogleSheetsCsvUrl(sheetUrl);
            
            using var httpClient = new HttpClient();
            using var response = await httpClient.GetAsync(csvUrl);
            response.EnsureSuccessStatusCode();
            
            using var stream = await response.Content.ReadAsStreamAsync();
            
            // Use CSV import logic
            var csvMapping = new CsvMappingDto
            {
                ColumnMapping = mapping.ColumnMapping,
                SkipFirstRow = mapping.SkipFirstRow,
                Delimiter = ",",
                DefaultStageId = mapping.DefaultStageId,
                SkipDuplicates = mapping.SkipDuplicates
            };
            
            return await ImportFromCsvAsync(stream, "GoogleSheets", csvMapping);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing from Google Sheets");
            throw new InvalidOperationException($"Failed to import from Google Sheets: {ex.Message}", ex);
        }
    }

    public async Task<ExtractedLeadDto> ExtractFromScreenshotAsync(Stream imageStream, string fileName)
    {
        // This is a placeholder for OCR functionality
        // In production, you would integrate with Azure Computer Vision, AWS Textract, or similar
        _logger.LogWarning("OCR extraction not implemented on server side. Use client-side Tesseract.js");
        
        return await System.Threading.Tasks.Task.FromResult(new ExtractedLeadDto
        {
            Confidence = 0.0f,
            RawText = "Server-side OCR not implemented. Please use client-side extraction."
        });
    }

    public async Task<ImportResultDto> ImportFromScreenshotAsync(Stream imageStream, string fileName, Guid? defaultStageId)
    {
        var extracted = await ExtractFromScreenshotAsync(imageStream, fileName);
        
        if (extracted.Confidence < 0.5f)
        {
            throw new InvalidOperationException("OCR confidence too low. Please use client-side extraction.");
        }
        
        // Create lead from extracted data
        var leads = new List<CreateLeadDto>
        {
            new CreateLeadDto
            {
                Title = $"{extracted.FirstName} {extracted.LastName}".Trim(),
                FirstName = extracted.FirstName ?? "Unknown",
                LastName = extracted.LastName ?? "Unknown",
                Email = extracted.Email ?? "",
                PhoneNumber = extracted.PhoneNumber,
                Company = extracted.Company,
                JobTitle = extracted.JobTitle,
                Source = "Screenshot OCR",
                StageId = defaultStageId ?? Guid.Empty
            }
        };
        
        return await BatchCreateLeadsAsync(leads, true, defaultStageId);
    }

    public async Task<ImportResultDto> BatchCreateLeadsAsync(List<CreateLeadDto> leads, bool skipDuplicates, Guid? defaultStageId)
    {
        var result = new ImportResultDto
        {
            ImportId = Guid.NewGuid(),
            TotalProcessed = leads.Count,
            ImportedAt = DateTime.UtcNow
        };
        
        // Get default stage if needed
        if (defaultStageId == null)
        {
            var defaultStage = await _context.Stages
                .OrderBy(s => s.Order)
                .FirstOrDefaultAsync();
            
            defaultStageId = defaultStage?.Id;
            
            if (defaultStageId == null)
            {
                throw new InvalidOperationException("No stages found.");
            }
        }
        
        foreach (var (lead, index) in leads.Select((l, i) => (l, i)))
        {
            try
            {
                // Ensure stage is set
                if (lead.StageId == Guid.Empty)
                {
                    lead.StageId = defaultStageId.Value;
                }
                
                // Check for duplicates
                if (skipDuplicates && !string.IsNullOrWhiteSpace(lead.Email))
                {
                    var exists = await _context.Leads.AnyAsync(l => l.Email == lead.Email);
                    if (exists)
                    {
                        result.DuplicateCount++;
                        continue;
                    }
                }
                
                var createdLead = await _leadService.CreateLeadAsync(lead);
                result.SuccessCount++;
                result.CreatedLeadIds.Add(createdLead.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lead {Index}", index);
                result.ErrorCount++;
                result.Errors.Add(new ImportErrorDto
                {
                    RowNumber = index + 1,
                    Error = ex.Message,
                    RowData = new Dictionary<string, string>
                    {
                        ["Email"] = lead.Email,
                        ["FirstName"] = lead.FirstName,
                        ["LastName"] = lead.LastName
                    }
                });
            }
        }
        
        return result;
    }

    public async Task<List<ImportHistoryDto>> GetImportHistoryAsync(int page = 1, int pageSize = 20)
    {
        var skip = (page - 1) * pageSize;
        
        return await _context.ImportHistories
            .Include(h => h.ImportedByUser)
            .OrderByDescending(h => h.ImportedAt)
            .Skip(skip)
            .Take(pageSize)
            .Select(h => new ImportHistoryDto
            {
                Id = h.Id,
                FileName = h.FileName,
                Source = h.Source.ToString(),
                TotalRows = h.TotalRows,
                SuccessCount = h.SuccessCount,
                ErrorCount = h.ErrorCount,
                DuplicateCount = h.DuplicateCount,
                ErrorDetails = h.ErrorDetails,
                ImportedByUserId = h.ImportedByUserId,
                ImportedByUserName = h.ImportedByUser != null ? $"{h.ImportedByUser.FirstName} {h.ImportedByUser.LastName}" : "Unknown",
                ImportedAt = h.ImportedAt,
                Duration = h.DurationMs.HasValue ? TimeSpan.FromMilliseconds(h.DurationMs.Value) : TimeSpan.Zero
            })
            .ToListAsync();
    }

    public async Task<ImportHistoryDto?> GetImportHistoryByIdAsync(Guid id)
    {
        return await _context.ImportHistories
            .Include(h => h.ImportedByUser)
            .Where(h => h.Id == id)
            .Select(h => new ImportHistoryDto
            {
                Id = h.Id,
                FileName = h.FileName,
                Source = h.Source.ToString(),
                TotalRows = h.TotalRows,
                SuccessCount = h.SuccessCount,
                ErrorCount = h.ErrorCount,
                DuplicateCount = h.DuplicateCount,
                ErrorDetails = h.ErrorDetails,
                ImportedByUserId = h.ImportedByUserId,
                ImportedByUserName = h.ImportedByUser != null ? $"{h.ImportedByUser.FirstName} {h.ImportedByUser.LastName}" : "Unknown",
                ImportedAt = h.ImportedAt,
                Duration = h.DurationMs.HasValue ? TimeSpan.FromMilliseconds(h.DurationMs.Value) : TimeSpan.Zero
            })
            .FirstOrDefaultAsync();
    }

    // Helper methods
    
    private async Task<List<Dictionary<string, string>>> ParseCsvFileAsync(Stream fileStream, CsvMappingDto mapping)
    {
        var rows = new List<Dictionary<string, string>>();
        
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = mapping.Delimiter,
            HasHeaderRecord = mapping.SkipFirstRow,
            MissingFieldFound = null,
            BadDataFound = null
        };
        
        using var reader = new StreamReader(fileStream, Encoding.UTF8);
        using var csv = new CsvReader(reader, config);
        
        if (mapping.SkipFirstRow)
        {
            await csv.ReadAsync();
            csv.ReadHeader();
        }
        
        while (await csv.ReadAsync())
        {
            var row = new Dictionary<string, string>();
            
            for (int i = 0; i < csv.HeaderRecord?.Length || i < csv.Parser.Count; i++)
            {
                var header = mapping.SkipFirstRow && csv.HeaderRecord != null && i < csv.HeaderRecord.Length
                    ? csv.HeaderRecord[i]
                    : $"Column{i}";
                
                var value = csv.GetField(i) ?? string.Empty;
                row[header] = value;
            }
            
            rows.Add(row);
        }
        
        return rows;
    }
    
    private ImportRowDto MapToImportRow(Dictionary<string, string> row, int rowNumber, CsvMappingDto mapping)
    {
        var importRow = new ImportRowDto
        {
            RowNumber = rowNumber,
            IsValid = true
        };
        
        // Map fields based on column mapping
        foreach (var map in mapping.ColumnMapping)
        {
            if (row.TryGetValue(map.Key, out var value))
            {
                switch (map.Value.ToLowerInvariant())
                {
                    case "firstname":
                        importRow.FirstName = value;
                        break;
                    case "lastname":
                        importRow.LastName = value;
                        break;
                    case "email":
                        importRow.Email = value;
                        break;
                    case "phonenumber":
                    case "phone":
                        importRow.PhoneNumber = value;
                        break;
                    case "company":
                        importRow.Company = value;
                        break;
                    case "jobtitle":
                    case "title":
                        importRow.JobTitle = value;
                        break;
                    case "estimatedvalue":
                    case "value":
                        if (decimal.TryParse(value, out var decValue))
                        {
                            importRow.EstimatedValue = decValue;
                        }
                        break;
                    case "probability":
                        if (int.TryParse(value, out var intValue))
                        {
                            importRow.Probability = intValue;
                        }
                        break;
                    case "source":
                        importRow.Source = value;
                        break;
                    case "notes":
                        importRow.Notes = value;
                        break;
                }
            }
        }
        
        // Validate required fields
        if (string.IsNullOrWhiteSpace(importRow.FirstName))
        {
            importRow.ValidationErrors.Add("FirstName is required");
            importRow.IsValid = false;
        }
        
        if (string.IsNullOrWhiteSpace(importRow.LastName))
        {
            importRow.ValidationErrors.Add("LastName is required");
            importRow.IsValid = false;
        }
        
        if (string.IsNullOrWhiteSpace(importRow.Email))
        {
            importRow.ValidationErrors.Add("Email is required");
            importRow.IsValid = false;
        }
        else if (!IsValidEmail(importRow.Email))
        {
            importRow.ValidationErrors.Add("Email format is invalid");
            importRow.IsValid = false;
        }
        
        return importRow;
    }
    
    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
    
    private string ConvertToGoogleSheetsCsvUrl(string sheetUrl)
    {
        // Extract spreadsheet ID from various Google Sheets URL formats
        var match = Regex.Match(sheetUrl, @"/spreadsheets/d/([a-zA-Z0-9-_]+)");
        if (!match.Success)
        {
            throw new ArgumentException("Invalid Google Sheets URL");
        }
        
        var spreadsheetId = match.Groups[1].Value;
        
        // Extract gid (sheet ID) if present
        var gidMatch = Regex.Match(sheetUrl, @"[#&]gid=([0-9]+)");
        var gid = gidMatch.Success ? gidMatch.Groups[1].Value : "0";
        
        // Build CSV export URL
        return $"https://docs.google.com/spreadsheets/d/{spreadsheetId}/export?format=csv&gid={gid}";
    }
}

