import api from './api';

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  previewRows: ImportRow[];
  errors: string[];
  warnings: string[];
}

export interface ImportRow {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  estimatedValue?: number;
  probability?: number;
  source?: string;
  notes?: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface ImportResult {
  importId: string;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  skippedCount: number;
  errors: ImportError[];
  createdLeadIds: string[];
  importedAt: string;
}

export interface ImportError {
  rowNumber: number;
  error: string;
  rowData: Record<string, string>;
}

export interface CsvMapping {
  columnMapping: Record<string, string>;
  skipFirstRow: boolean;
  delimiter: string;
  defaultStageId?: string;
  skipDuplicates: boolean;
}

export interface SheetMapping {
  sheetUrl: string;
  sheetName?: string;
  range?: string;
  columnMapping: Record<string, string>;
  skipFirstRow: boolean;
  defaultStageId?: string;
  skipDuplicates: boolean;
}

export interface ExtractedLead {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  website?: string;
  confidence: number;
  rawText?: string;
  fieldConfidence: Record<string, number>;
}

export interface ImportHistory {
  id: string;
  fileName: string;
  source: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  errorDetails?: string;
  importedByUserId: string;
  importedByUserName?: string;
  importedAt: string;
  duration: string;
}

export const leadImportApi = {
  /**
   * Preview CSV import
   */
  previewCsv: async (file: File, delimiter: string = ',', skipFirstRow: boolean = true): Promise<ImportPreview> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('delimiter', delimiter);
    formData.append('skipFirstRow', skipFirstRow.toString());

    const response = await api.post<ImportPreview>('/lead-import/csv/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Import from CSV
   */
  importCsv: async (file: File, mapping?: CsvMapping): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (mapping) {
      formData.append('mappingJson', JSON.stringify(mapping));
    }

    const response = await api.post<ImportResult>('/lead-import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Preview Google Sheets import
   */
  previewGoogleSheets: async (sheetUrl: string, mapping: SheetMapping): Promise<ImportPreview> => {
    const response = await api.post<ImportPreview>('/lead-import/google-sheets/preview', {
      sheetUrl,
      mapping,
    });
    return response.data;
  },

  /**
   * Import from Google Sheets
   */
  importGoogleSheets: async (sheetUrl: string, mapping: SheetMapping): Promise<ImportResult> => {
    const response = await api.post<ImportResult>('/lead-import/google-sheets', {
      sheetUrl,
      mapping,
      previewOnly: false,
    });
    return response.data;
  },

  /**
   * Extract lead from screenshot (server-side - not implemented)
   */
  extractFromScreenshot: async (file: File): Promise<ExtractedLead> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ExtractedLead>('/lead-import/screenshot/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Batch create leads
   */
  batchCreateLeads: async (leads: any[], skipDuplicates: boolean = true, defaultStageId?: string): Promise<ImportResult> => {
    const response = await api.post<ImportResult>('/lead-import/batch', {
      leads,
      skipDuplicates,
      defaultStageId,
    });
    return response.data;
  },

  /**
   * Get import history
   */
  getImportHistory: async (page: number = 1, pageSize: number = 20): Promise<ImportHistory[]> => {
    const response = await api.get<ImportHistory[]>('/lead-import/history', {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get import history by ID
   */
  getImportHistoryById: async (id: string): Promise<ImportHistory> => {
    const response = await api.get<ImportHistory>(`/lead-import/history/${id}`);
    return response.data;
  },
};

