import Tesseract from 'tesseract.js';
import type { ExtractedLead } from './leadImportApi';

/**
 * Extract text from image using Tesseract.js OCR
 */
export async function extractTextFromImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const result = await Tesseract.recognize(file, 'eng+fra', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  return result.data.text;
}

/**
 * Extract email addresses from text
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract phone numbers from text (various formats)
 */
function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g;
  const matches = text.match(phoneRegex) || [];
  
  // Filter out numbers that are too short or too long
  return matches.filter(phone => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  });
}

/**
 * Extract names from text (heuristic approach)
 */
function extractNames(text: string): { firstName: string; lastName: string } | null {
  // Look for lines with 2 capitalized words (likely name)
  const nameRegex = /^([A-ZÀ-Ý][a-zà-ÿ]+)\s+([A-ZÀ-Ý][a-zà-ÿ]+)/m;
  const match = text.match(nameRegex);
  
  if (match) {
    return {
      firstName: match[1],
      lastName: match[2],
    };
  }
  
  // Try to find name on first non-empty lines
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    const words = lines[0].split(/\s+/);
    if (words.length >= 2) {
      return {
        firstName: words[0],
        lastName: words[1],
      };
    }
  }
  
  return null;
}

/**
 * Extract company name from text
 */
function extractCompany(text: string): string | null {
  // Look for common company suffixes
  const companyRegex = /([\w\s&]+)\s+(Inc\.|LLC|Ltd\.|Corp\.|Corporation|Company|S\.A\.|SARL)/i;
  const match = text.match(companyRegex);
  
  if (match) {
    return match[0].trim();
  }
  
  // Look for all-caps lines (often company names)
  const lines = text.split('\n').map(l => l.trim());
  for (const line of lines) {
    if (line.length > 3 && line.length < 50 && line === line.toUpperCase()) {
      return line;
    }
  }
  
  return null;
}

/**
 * Extract job title from text
 */
function extractJobTitle(text: string): string | null {
  const commonTitles = [
    'CEO', 'CTO', 'CFO', 'COO', 'CMO',
    'Director', 'Directeur', 'Manager', 'Responsable',
    'President', 'Vice President', 'VP',
    'Engineer', 'Ingénieur', 'Developer', 'Développeur',
    'Designer', 'Analyst', 'Consultant',
    'Specialist', 'Spécialiste', 'Coordinator',
    'Assistant', 'Associate', 'Representative'
  ];
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    for (const title of commonTitles) {
      if (line.toLowerCase().includes(title.toLowerCase())) {
        return line;
      }
    }
  }
  
  return null;
}

/**
 * Extract website URLs from text
 */
function extractWebsites(text: string): string[] {
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  return text.match(urlRegex) || [];
}

/**
 * Calculate overall confidence based on extracted fields
 */
function calculateConfidence(extracted: Partial<ExtractedLead>): number {
  let confidence = 0;
  let totalFields = 0;
  
  const fields = [
    { key: 'email', weight: 0.25 },
    { key: 'phoneNumber', weight: 0.15 },
    { key: 'firstName', weight: 0.15 },
    { key: 'lastName', weight: 0.15 },
    { key: 'company', weight: 0.15 },
    { key: 'jobTitle', weight: 0.10 },
    { key: 'website', weight: 0.05 },
  ];
  
  for (const field of fields) {
    totalFields += field.weight;
    if (extracted[field.key as keyof ExtractedLead]) {
      confidence += field.weight;
    }
  }
  
  return confidence / totalFields;
}

/**
 * Extract lead information from image file
 */
export async function extractLeadFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ExtractedLead> {
  try {
    // Extract text using OCR
    const text = await extractTextFromImage(file, onProgress);
    
    // Parse extracted text
    const emails = extractEmails(text);
    const phones = extractPhones(text);
    const names = extractNames(text);
    const company = extractCompany(text);
    const jobTitle = extractJobTitle(text);
    const websites = extractWebsites(text);
    
    // Build extracted lead data
    const extracted: Partial<ExtractedLead> = {
      rawText: text,
      email: emails[0],
      phoneNumber: phones[0],
      firstName: names?.firstName,
      lastName: names?.lastName,
      company,
      jobTitle,
      website: websites[0],
      fieldConfidence: {
        email: emails.length > 0 ? 0.9 : 0,
        phoneNumber: phones.length > 0 ? 0.8 : 0,
        firstName: names ? 0.7 : 0,
        lastName: names ? 0.7 : 0,
        company: company ? 0.6 : 0,
        jobTitle: jobTitle ? 0.5 : 0,
        website: websites.length > 0 ? 0.8 : 0,
      },
    };
    
    // Calculate overall confidence
    extracted.confidence = calculateConfidence(extracted);
    
    return extracted as ExtractedLead;
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate extracted lead data
 */
export function validateExtractedLead(lead: ExtractedLead): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!lead.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.push('Invalid email format');
  }
  
  if (!lead.firstName) {
    errors.push('First name is required');
  }
  
  if (!lead.lastName) {
    errors.push('Last name is required');
  }
  
  if (lead.confidence < 0.3) {
    errors.push('OCR confidence is too low. Please review and correct the extracted data.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

