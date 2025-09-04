# ADR-006: Import/Export Strategy

## Status
Accepted

## Context
Lead Tracker needs robust import/export capabilities for:
- CSV import with field mapping and validation
- Bulk data migration from other CRM systems
- Data backup and restore functionality
- Excel export with filtering and formatting
- Error reporting and data quality validation
- Progress tracking for large operations

## Decision
We will implement a **multi-stage processing pipeline** with background jobs:

### Architecture Components:
1. **Upload Service** for file handling and validation
2. **Mapping Engine** for field transformation and validation
3. **Background Processing** with Hangfire for bulk operations
4. **Progress Tracking** with real-time updates
5. **Error Reporting** with detailed validation results
6. **Export Service** with multiple format support

### Import Process Flow:

#### 1. File Upload and Validation
```csharp
public class ImportService
{
    public async Task<ImportSession> StartImportAsync(IFormFile file, Guid organizationId, Guid userId)
    {
        // Validate file
        ValidateFile(file);
        
        // Create import session
        var session = new ImportSession
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            UserId = userId,
            FileName = file.FileName,
            FileSize = file.Length,
            Status = ImportStatus.Uploading,
            CreatedAt = DateTime.UtcNow
        };
        
        // Save file to temporary storage
        var filePath = await SaveFileAsync(file, session.Id);
        session.FilePath = filePath;
        
        // Parse CSV headers
        session.Headers = await ParseCsvHeadersAsync(filePath);
        session.Status = ImportStatus.MappingRequired;
        
        await _context.ImportSessions.AddAsync(session);
        await _context.SaveChangesAsync();
        
        return session;
    }
}
```

#### 2. Field Mapping Interface
```csharp
public class FieldMappingRequest
{
    public Guid ImportSessionId { get; set; }
    public Dictionary<string, string> FieldMappings { get; set; } // CSV Column -> Lead Property
    public ImportOptions Options { get; set; }
}

public class ImportOptions
{
    public bool SkipDuplicates { get; set; } = true;
    public bool UpdateExisting { get; set; } = false;
    public string DuplicateCheckField { get; set; } = "Email"; // Email, Phone, or Custom
    public bool ValidateEmails { get; set; } = true;
    public bool ValidatePhones { get; set; } = true;
    public Guid? DefaultStageId { get; set; }
    public Guid? DefaultAssigneeId { get; set; }
}
```

#### 3. Data Validation and Preview
```csharp
public class ImportPreviewService
{
    public async Task<ImportPreview> GeneratePreviewAsync(FieldMappingRequest request)
    {
        var session = await GetImportSessionAsync(request.ImportSessionId);
        var rows = await ParseCsvRowsAsync(session.FilePath, maxRows: 100); // Preview first 100 rows
        
        var preview = new ImportPreview
        {
            TotalRows = await CountCsvRowsAsync(session.FilePath),
            PreviewRows = new List<ImportPreviewRow>()
        };
        
        foreach (var row in rows)
        {
            var previewRow = new ImportPreviewRow
            {
                RowNumber = row.RowNumber,
                MappedData = MapRowToLead(row.Data, request.FieldMappings),
                ValidationErrors = await ValidateRowAsync(row.Data, request.FieldMappings, request.Options)
            };
            
            preview.PreviewRows.Add(previewRow);
        }
        
        preview.EstimatedErrors = preview.PreviewRows.Count(r => r.ValidationErrors.Any());
        preview.EstimatedDuplicates = await EstimateDuplicatesAsync(request);
        
        return preview;
    }
}
```

#### 4. Background Processing
```csharp
public class ImportProcessingJob
{
    [Queue("import")]
    [DisableConcurrentExecution(timeoutInSeconds: 30 * 60)] // 30 minutes max
    public async Task ProcessImportAsync(Guid importSessionId)
    {
        var session = await _context.ImportSessions.FindAsync(importSessionId);
        session.Status = ImportStatus.Processing;
        session.StartedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        try
        {
            var results = new ImportResults
            {
                ImportSessionId = importSessionId,
                ProcessedRows = 0,
                SuccessfulRows = 0,
                ErrorRows = 0,
                DuplicateRows = 0,
                Errors = new List<ImportError>()
            };
            
            await ProcessCsvInBatchesAsync(session, results);
            
            session.Status = ImportStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
            session.Results = JsonSerializer.Serialize(results);
            
            // Send completion notification
            await _notificationService.NotifyImportCompletedAsync(session.UserId, results);
        }
        catch (Exception ex)
        {
            session.Status = ImportStatus.Failed;
            session.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Import failed for session {ImportSessionId}", importSessionId);
        }
        
        await _context.SaveChangesAsync();
    }
    
    private async Task ProcessCsvInBatchesAsync(ImportSession session, ImportResults results)
    {
        const int batchSize = 100;
        var batchNumber = 0;
        
        await foreach (var batch in ReadCsvInBatchesAsync(session.FilePath, batchSize))
        {
            batchNumber++;
            _logger.LogInformation("Processing batch {BatchNumber} for import {ImportSessionId}", batchNumber, session.Id);
            
            foreach (var row in batch)
            {
                try
                {
                    var lead = await ProcessRowAsync(row, session);
                    if (lead != null)
                    {
                        results.SuccessfulRows++;
                    }
                    else
                    {
                        results.DuplicateRows++;
                    }
                }
                catch (ValidationException ex)
                {
                    results.ErrorRows++;
                    results.Errors.Add(new ImportError
                    {
                        RowNumber = row.RowNumber,
                        Field = ex.PropertyName,
                        Message = ex.Message,
                        Value = ex.AttemptedValue?.ToString()
                    });
                }
                
                results.ProcessedRows++;
                
                // Update progress every 50 rows
                if (results.ProcessedRows % 50 == 0)
                {
                    await UpdateImportProgressAsync(session.Id, results.ProcessedRows);
                }
            }
            
            // Save batch to database
            await _context.SaveChangesAsync();
        }
    }
}
```

### Export Implementation:

#### 1. Export Service
```csharp
public class ExportService
{
    public async Task<ExportSession> StartExportAsync(ExportRequest request, Guid organizationId, Guid userId)
    {
        var session = new ExportSession
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            UserId = userId,
            Format = request.Format,
            Filters = JsonSerializer.Serialize(request.Filters),
            Status = ExportStatus.Processing,
            CreatedAt = DateTime.UtcNow
        };
        
        await _context.ExportSessions.AddAsync(session);
        await _context.SaveChangesAsync();
        
        // Queue background job
        BackgroundJob.Enqueue<ExportProcessingJob>(x => x.ProcessExportAsync(session.Id));
        
        return session;
    }
}

public class ExportProcessingJob
{
    [Queue("export")]
    public async Task ProcessExportAsync(Guid exportSessionId)
    {
        var session = await _context.ExportSessions.FindAsync(exportSessionId);
        
        try
        {
            var filters = JsonSerializer.Deserialize<LeadFilters>(session.Filters);
            var leads = await GetFilteredLeadsAsync(session.OrganizationId, filters);
            
            byte[] fileContent;
            string mimeType;
            string fileExtension;
            
            switch (session.Format)
            {
                case ExportFormat.Csv:
                    fileContent = await GenerateCsvAsync(leads);
                    mimeType = "text/csv";
                    fileExtension = "csv";
                    break;
                    
                case ExportFormat.Excel:
                    fileContent = await GenerateExcelAsync(leads);
                    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    fileExtension = "xlsx";
                    break;
                    
                default:
                    throw new NotSupportedException($"Export format {session.Format} not supported");
            }
            
            // Save file to storage
            var fileName = $"leads_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.{fileExtension}";
            var filePath = await _fileStorage.SaveAsync(fileName, fileContent);
            
            session.Status = ExportStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
            session.FilePath = filePath;
            session.FileSize = fileContent.Length;
            session.RecordCount = leads.Count;
            
            // Send download notification
            await _notificationService.NotifyExportCompletedAsync(session.UserId, session);
        }
        catch (Exception ex)
        {
            session.Status = ExportStatus.Failed;
            session.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Export failed for session {ExportSessionId}", exportSessionId);
        }
        
        await _context.SaveChangesAsync();
    }
}
```

#### 2. CSV Generation
```csharp
public class CsvExportGenerator
{
    public async Task<byte[]> GenerateCsvAsync(List<Lead> leads)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);
        
        // Configure CSV options
        csv.Configuration.HasHeaderRecord = true;
        csv.Configuration.ShouldQuote = (field, context) => true; // Quote all fields for Excel compatibility
        
        // Write headers
        csv.WriteField("First Name");
        csv.WriteField("Last Name");
        csv.WriteField("Email");
        csv.WriteField("Phone");
        csv.WriteField("Company");
        csv.WriteField("Title");
        csv.WriteField("Value");
        csv.WriteField("Stage");
        csv.WriteField("Source");
        csv.WriteField("Assigned To");
        csv.WriteField("Created Date");
        csv.WriteField("Updated Date");
        csv.NextRecord();
        
        // Write data rows
        foreach (var lead in leads)
        {
            csv.WriteField(lead.FirstName);
            csv.WriteField(lead.LastName);
            csv.WriteField(lead.Email);
            csv.WriteField(lead.Phone);
            csv.WriteField(lead.Company);
            csv.WriteField(lead.Title);
            csv.WriteField(lead.Value?.ToString("F2"));
            csv.WriteField(lead.Stage?.Name);
            csv.WriteField(lead.Source.ToString());
            csv.WriteField(lead.AssignedTo?.FirstName + " " + lead.AssignedTo?.LastName);
            csv.WriteField(lead.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"));
            csv.WriteField(lead.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"));
            csv.NextRecord();
        }
        
        await writer.FlushAsync();
        return memoryStream.ToArray();
    }
}
```

#### 3. Excel Generation with Formatting
```csharp
public class ExcelExportGenerator
{
    public async Task<byte[]> GenerateExcelAsync(List<Lead> leads)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Leads");
        
        // Set up headers with formatting
        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightBlue;
        
        var headers = new[] { "First Name", "Last Name", "Email", "Phone", "Company", 
                            "Title", "Value", "Stage", "Source", "Assigned To", 
                            "Created Date", "Updated Date" };
        
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
        }
        
        // Add data rows
        for (int i = 0; i < leads.Count; i++)
        {
            var lead = leads[i];
            var row = i + 2; // Start from row 2 (after headers)
            
            worksheet.Cell(row, 1).Value = lead.FirstName;
            worksheet.Cell(row, 2).Value = lead.LastName;
            worksheet.Cell(row, 3).Value = lead.Email;
            worksheet.Cell(row, 4).Value = lead.Phone;
            worksheet.Cell(row, 5).Value = lead.Company;
            worksheet.Cell(row, 6).Value = lead.Title;
            worksheet.Cell(row, 7).Value = lead.Value;
            worksheet.Cell(row, 8).Value = lead.Stage?.Name;
            worksheet.Cell(row, 9).Value = lead.Source.ToString();
            worksheet.Cell(row, 10).Value = $"{lead.AssignedTo?.FirstName} {lead.AssignedTo?.LastName}".Trim();
            worksheet.Cell(row, 11).Value = lead.CreatedAt;
            worksheet.Cell(row, 12).Value = lead.UpdatedAt;
        }
        
        // Auto-fit columns
        worksheet.Columns().AdjustToContents();
        
        // Format date columns
        worksheet.Column(11).Style.DateFormat.Format = "yyyy-mm-dd hh:mm:ss";
        worksheet.Column(12).Style.DateFormat.Format = "yyyy-mm-dd hh:mm:ss";
        
        // Format value column as currency
        worksheet.Column(7).Style.NumberFormat.Format = "€#,##0.00";
        
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
```

### Frontend Implementation:

#### 1. Import Wizard Component
```typescript
// components/import/ImportWizard.tsx
export function ImportWizard() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing'>('upload');
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  
  const handleFileUpload = async (file: File) => {
    const session = await uploadImportFile(file);
    setImportSession(session);
    setStep('mapping');
  };
  
  const handleMappingComplete = async () => {
    const preview = await generateImportPreview(importSession!.id, fieldMappings);
    setStep('preview');
  };
  
  const handleImportStart = async () => {
    await startImportProcessing(importSession!.id, fieldMappings);
    setStep('processing');
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <ImportSteps currentStep={step} />
      
      {step === 'upload' && (
        <FileUploadStep onFileUpload={handleFileUpload} />
      )}
      
      {step === 'mapping' && importSession && (
        <FieldMappingStep 
          headers={importSession.headers}
          mappings={fieldMappings}
          onMappingsChange={setFieldMappings}
          onNext={handleMappingComplete}
        />
      )}
      
      {step === 'preview' && (
        <ImportPreviewStep 
          sessionId={importSession!.id}
          onConfirm={handleImportStart}
        />
      )}
      
      {step === 'processing' && (
        <ImportProgressStep sessionId={importSession!.id} />
      )}
    </div>
  );
}
```

#### 2. Real-time Progress Tracking
```typescript
// hooks/useImportProgress.ts
export function useImportProgress(sessionId: string) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/imports/${sessionId}/progress`);
    
    eventSource.onmessage = (event) => {
      const progressData = JSON.parse(event.data);
      setProgress(progressData);
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };
    
    return () => eventSource.close();
  }, [sessionId]);
  
  return progress;
}
```

## Data Quality and Validation

### 1. Validation Rules Engine
```csharp
public class ImportValidationService
{
    private readonly List<IImportValidator> _validators;
    
    public async Task<List<ValidationError>> ValidateRowAsync(Dictionary<string, string> row, ImportOptions options)
    {
        var errors = new List<ValidationError>();
        
        foreach (var validator in _validators)
        {
            var result = await validator.ValidateAsync(row, options);
            errors.AddRange(result);
        }
        
        return errors;
    }
}

public class EmailValidator : IImportValidator
{
    public Task<List<ValidationError>> ValidateAsync(Dictionary<string, string> row, ImportOptions options)
    {
        var errors = new List<ValidationError>();
        
        if (row.TryGetValue("Email", out var email) && !string.IsNullOrEmpty(email))
        {
            if (!IsValidEmail(email))
            {
                errors.Add(new ValidationError("Email", "Invalid email format", email));
            }
        }
        
        return Task.FromResult(errors);
    }
}
```

### 2. Duplicate Detection
```csharp
public class DuplicateDetectionService
{
    public async Task<List<DuplicateMatch>> FindDuplicatesAsync(List<Lead> importLeads, Guid organizationId)
    {
        var duplicates = new List<DuplicateMatch>();
        var existingLeads = await _context.Leads
            .Where(l => l.OrganizationId == organizationId)
            .Select(l => new { l.Id, l.Email, l.Phone, l.FirstName, l.LastName })
            .ToListAsync();
        
        foreach (var importLead in importLeads)
        {
            var matches = existingLeads.Where(existing => 
                (!string.IsNullOrEmpty(importLead.Email) && existing.Email == importLead.Email) ||
                (!string.IsNullOrEmpty(importLead.Phone) && existing.Phone == importLead.Phone) ||
                (existing.FirstName == importLead.FirstName && existing.LastName == importLead.LastName)
            ).ToList();
            
            if (matches.Any())
            {
                duplicates.Add(new DuplicateMatch
                {
                    ImportLead = importLead,
                    ExistingLeads = matches,
                    MatchType = DetermineMatchType(importLead, matches.First())
                });
            }
        }
        
        return duplicates;
    }
}
```

## Consequences

### Positive:
- **Scalable**: Background processing handles large files
- **User-friendly**: Step-by-step wizard with preview
- **Reliable**: Error handling and progress tracking
- **Flexible**: Multiple export formats and field mapping

### Negative:
- **Complexity**: Multi-step process with state management
- **Storage**: Temporary files require cleanup
- **Processing Time**: Large imports may take significant time

### Implementation Checklist:
- [ ] Implement file upload and validation service
- [ ] Create field mapping interface and engine
- [ ] Build background processing jobs with Hangfire
- [ ] Add real-time progress tracking with SignalR
- [ ] Implement CSV and Excel export generators
- [ ] Create validation rules engine
- [ ] Add duplicate detection and handling
- [ ] Build import/export wizard UI components
- [ ] Implement error reporting and user notifications
- [ ] Add file cleanup and storage management
