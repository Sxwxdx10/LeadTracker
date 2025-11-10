import Papa from 'papaparse';

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Convert Google Sheets URL to CSV export URL
 */
export function convertToGoogleSheetsCsvUrl(sheetUrl: string): string {
  // Extract spreadsheet ID from various URL formats
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  
  if (!match) {
    throw new Error('Invalid Google Sheets URL format');
  }
  
  const spreadsheetId = match[1];
  
  // Extract gid (sheet ID) if present
  const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  
  // Build CSV export URL
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Validate Google Sheets URL
 */
export function isValidGoogleSheetsUrl(url: string): boolean {
  return /\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(url);
}

/**
 * Fetch data from Google Sheets
 */
export async function fetchGoogleSheetData(sheetUrl: string): Promise<SheetData> {
  try {
    // Convert to CSV export URL
    const csvUrl = convertToGoogleSheetsCsvUrl(sheetUrl);
    
    // Fetch CSV data
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheets data: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    
    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }
    
    return {
      headers: result.meta.fields || [],
      rows: result.data as Record<string, string>[],
      totalRows: result.data.length,
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw new Error(
      `Failed to fetch Google Sheets data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse CSV file locally
 */
export async function parseCsvFile(file: File): Promise<SheetData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        resolve({
          headers: result.meta.fields || [],
          rows: result.data as Record<string, string>[],
          totalRows: result.data.length,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Auto-detect column mapping based on common field names
 */
export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  const fieldPatterns: Record<string, RegExp[]> = {
    firstName: [/first[\s_-]?name/i, /prénom/i, /prenom/i, /fname/i],
    lastName: [/last[\s_-]?name/i, /nom[\s_-]?de[\s_-]?famille/i, /nom/i, /lname/i],
    email: [/e?[-_]?mail/i, /courriel/i],
    phoneNumber: [/phone/i, /tel/i, /téléphone/i, /telephone/i, /mobile/i],
    company: [/company/i, /entreprise/i, /société/i, /societe/i, /organization/i],
    jobTitle: [/title/i, /job[\s_-]?title/i, /position/i, /poste/i, /fonction/i],
    source: [/source/i, /origine/i],
    notes: [/notes?/i, /comment/i, /description/i],
    estimatedValue: [/value/i, /valeur/i, /amount/i, /montant/i],
    probability: [/probability/i, /probabilité/i, /probabilite/i, /chance/i],
  };
  
  for (const header of headers) {
    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          mapping[header] = field;
          break;
        }
      }
    }
  }
  
  return mapping;
}

/**
 * Convert rows to CreateLeadDto format
 */
export function convertRowsToLeads(
  rows: Record<string, string>[],
  columnMapping: Record<string, string>
): any[] {
  return rows.map((row) => {
    const lead: any = {};
    
    for (const [csvColumn, leadField] of Object.entries(columnMapping)) {
      const value = row[csvColumn];
      
      if (value) {
        // Handle numeric fields
        if (leadField === 'estimatedValue' || leadField === 'probability') {
          const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
          if (!isNaN(numValue)) {
            lead[leadField] = numValue;
          }
        } else {
          lead[leadField] = value.trim();
        }
      }
    }
    
    // Generate title if not provided
    if (!lead.title && (lead.firstName || lead.lastName || lead.company)) {
      lead.title = [lead.firstName, lead.lastName, lead.company]
        .filter(Boolean)
        .join(' ');
    }
    
    return lead;
  });
}

