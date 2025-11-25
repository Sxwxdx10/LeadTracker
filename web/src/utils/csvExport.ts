import { Lead } from '@/types/lead';

/**
 * Escape a CSV field value
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, newline, or double quote, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Format a date for CSV export
 */
function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Format a date-time for CSV export
 */
function formatDateTime(date: string | null | undefined): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Format currency for CSV export
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Convert leads to CSV format
 */
export function leadsToCsv(leads: Lead[]): string {
  // Define CSV headers
  const headers = [
    'ID',
    'Titre',
    'Prénom',
    'Nom',
    'Nom complet',
    'Email',
    'Téléphone',
    'Site web',
    'Entreprise',
    'Poste',
    'Valeur estimée',
    'Probabilité (%)',
    'Date de clôture prévue',
    'Source',
    'Statut',
    'Stage',
    'Utilisateur assigné',
    'Notes',
    'Date de création',
    'Dernière mise à jour',
  ];

  // Create CSV rows
  const rows = leads.map(lead => [
    escapeCsvField(lead.id),
    escapeCsvField(lead.title),
    escapeCsvField(lead.firstName),
    escapeCsvField(lead.lastName),
    escapeCsvField(`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.title),
    escapeCsvField(lead.email),
    escapeCsvField(lead.phoneNumber),
    escapeCsvField(lead.website),
    escapeCsvField(lead.company),
    escapeCsvField(lead.jobTitle),
    escapeCsvField(lead.estimatedValue ? formatCurrency(lead.estimatedValue) : ''),
    escapeCsvField(lead.probability?.toString() || ''),
    escapeCsvField(lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : ''),
    escapeCsvField(lead.source),
    escapeCsvField(lead.status),
    escapeCsvField(lead.stageName || lead.stage?.name || ''),
    escapeCsvField(lead.assignedUserName || ''),
    escapeCsvField(lead.notes),
    escapeCsvField(formatDateTime(lead.createdAt)),
    escapeCsvField(formatDateTime(lead.updatedAt)),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCsv(content: string, filename: string = 'leads_export.csv'): void {
  // Add BOM for UTF-8 to ensure Excel opens it correctly
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export leads to CSV file
 */
export function exportLeadsToCsv(leads: Lead[], filename?: string): void {
  const csvContent = leadsToCsv(leads);
  const defaultFilename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(csvContent, filename || defaultFilename);
}

