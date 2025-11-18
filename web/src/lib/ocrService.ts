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
 * Normalize phone number to backend format (+1XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle Canadian/US numbers
  if (digits.length === 10) {
    // 10 digits without country code - assume Canada/US (+1)
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // 11 digits starting with 1 - already has country code
    return `+${digits}`;
  } else if (digits.length >= 10 && digits.length <= 11) {
    // Other valid lengths
    if (digits.startsWith('1')) {
      return `+${digits}`;
    } else {
      return `+1${digits}`;
    }
  }
  
  return null;
}

/**
 * Extract phone numbers from text (various formats, optimized for Canadian/Quebec formats)
 */
function extractPhones(text: string): string[] {
  // Multiple patterns to catch different formats
  const patterns = [
    // Format: (514) 388-3819 or (438) 526-2602
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    // Format: +1 855-276-1947 or +1 855 276 1947
    /\+\d{1,3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/g,
    // Format: 514-388-3819 or 438.526.2602
    /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/g,
    // Format: 5143883819 (no separators)
    /\d{10}/g,
    // Generic international format
    /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g,
  ];
  
  const allMatches: string[] = [];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    allMatches.push(...matches);
  }
  
  // Remove duplicates and normalize
  const uniquePhones = Array.from(new Set(allMatches));
  
  // Filter and normalize phone numbers
  const validPhones: string[] = [];
  for (const phone of uniquePhones) {
    const digits = phone.replace(/\D/g, '');
    // Filter out numbers that are too short or too long
    if (digits.length >= 10 && digits.length <= 15) {
      const normalized = normalizePhoneNumber(phone);
      if (normalized && !validPhones.includes(normalized)) {
        validPhones.push(normalized);
      }
    }
  }
  
  return validPhones;
}

/**
 * Extract names from text (heuristic approach)
 * Optimized for Google Maps screenshots where business names appear first
 */
function extractNames(text: string): { firstName: string; lastName: string } | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return null;
  
  // Look for lines with 2 capitalized words (likely name)
  // Skip lines that look like addresses, phone numbers, or URLs
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    // Skip if line contains phone number pattern
    if (/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(line)) continue;
    // Skip if line contains email
    if (/@/.test(line)) continue;
    // Skip if line contains URL
    if (/https?:\/\//.test(line)) continue;
    // Skip if line is mostly numbers or special chars
    if (/^[\d\s\-\(\)\.]+$/.test(line)) continue;
    
    // Look for 2-3 capitalized words (could be person name or business name)
    const nameRegex = /^([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)?)\s+([A-ZÀ-Ý][a-zà-ÿ]+)/;
    const match = line.match(nameRegex);
    
    if (match) {
      // If first part has multiple words, use first as firstName, rest as lastName
      const firstPart = match[1].trim();
      const secondPart = match[2].trim();
      
      const firstWords = firstPart.split(/\s+/);
      if (firstWords.length > 1) {
        return {
          firstName: firstWords[0],
          lastName: firstWords.slice(1).join(' ') + ' ' + secondPart,
        };
      }
      
      return {
        firstName: firstPart,
        lastName: secondPart,
      };
    }
    
    // Try simple 2-word pattern
    const words = line.split(/\s+/).filter(w => w.length > 1);
    if (words.length >= 2 && words[0][0] === words[0][0].toUpperCase() && words[1][0] === words[1][0].toUpperCase()) {
      // Check if it's not all caps (which would be a company name)
      if (words[0] !== words[0].toUpperCase() || words[1] !== words[1].toUpperCase()) {
        return {
          firstName: words[0],
          lastName: words[1],
        };
      }
    }
  }
  
  return null;
}

/**
 * Extract company name from text
 * Optimized for Google Maps screenshots where business names appear first
 */
function extractCompany(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return null;
  
  // Look for common company suffixes
  const companyRegex = /([\w\s&]+)\s+(Inc\.|LLC|Ltd\.|Corp\.|Corporation|Company|S\.A\.|SARL|CPA|CA|Pl\.\s*Fin\.)/i;
  for (const line of lines) {
    const match = line.match(companyRegex);
    if (match) {
      return match[0].trim();
    }
  }
  
  // Look for all-caps lines (often company names in Google Maps)
  for (const line of lines.slice(0, 3)) { // Check first 3 lines
    // Skip if line contains phone number pattern
    if (/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(line)) continue;
    // Skip if line contains email
    if (/@/.test(line)) continue;
    // Skip if line contains URL
    if (/https?:\/\//.test(line)) continue;
    // Skip if line is mostly numbers or special chars
    if (/^[\d\s\-\(\)\.]+$/.test(line)) continue;
    
    // Check if line is all caps and reasonable length (likely business name)
    if (line.length > 3 && line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)) {
      return line;
    }
    
    // Check for business names with mixed case but longer (like "Lave Auto Grand Auto Car wash À La Main")
    if (line.length > 10 && line.length < 80 && !/@/.test(line) && !/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(line)) {
      // If it's the first line and doesn't look like a person name, it might be a business
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.some(w => w.length > 5)) {
        // Check if it contains business-related keywords
        const businessKeywords = ['auto', 'car', 'wash', 'lave', 'consultant', 'service', 'restaurant', 'cafe', 'shop', 'store'];
        if (businessKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
          return line;
        }
      }
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
 * Normalize website URL (add https:// if missing)
 */
function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  // If it already starts with http:// or https://, return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Otherwise, add https://
  return `https://${trimmed}`;
}

/**
 * Extract website URLs from text
 */
function extractWebsites(text: string): string[] {
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const matches = text.match(urlRegex) || [];
  
  // Normalize URLs
  return matches.map(normalizeWebsite);
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
    
    // Normalize phone number to backend format
    const normalizedPhone = phones[0] ? normalizePhoneNumber(phones[0]) : null;
    
    // Build extracted lead data
    const extracted: Partial<ExtractedLead> = {
      rawText: text,
      email: emails[0] || undefined,
      phoneNumber: normalizedPhone || undefined,
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
 * Requires either email or phone number (or both), but not neither
 */
export function validateExtractedLead(lead: ExtractedLead): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate email if provided
  if (lead.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      errors.push('Format email invalide');
    }
  }
  
  // Validate phone number if provided
  if (lead.phoneNumber) {
    // Backend expects format: +1XXXXXXXXXX (Canadian format)
    const phoneRegex = /^\+?1\d{10}$/;
    const digits = lead.phoneNumber.replace(/\D/g, '');
    if (!phoneRegex.test(`+${digits}`) && !phoneRegex.test(lead.phoneNumber)) {
      // Try to normalize it
      const normalized = normalizePhoneNumber(lead.phoneNumber);
      if (!normalized || !phoneRegex.test(normalized)) {
        errors.push('Format de téléphone invalide. Format attendu: +1XXXXXXXXXX');
      }
    }
  }
  
  // Require either email or phone number (or both), but not neither
  if (!lead.email && !lead.phoneNumber) {
    errors.push('Au moins un email ou un numéro de téléphone est requis');
  }
  
  // First name and last name are optional for screenshot imports
  // (they can be extracted from company name or other fields)
  
  if (lead.confidence < 0.3) {
    errors.push('La confiance OCR est trop faible. Veuillez vérifier et corriger les données extraites.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

