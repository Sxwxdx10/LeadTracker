import { useLanguage } from '@/contexts/LanguageContext';
import frTranslations from '@/locales/fr.json';
import enTranslations from '@/locales/en.json';

// Type for translations
export type TranslationKey = keyof typeof frTranslations;
type NestedTranslationKey<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedTranslationKey<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationPath = NestedTranslationKey<typeof frTranslations>;

// Translations object
const translations = {
  fr: frTranslations,
  en: enTranslations,
};

/**
 * Get nested value from object using dot notation
 * Example: get(obj, 'user.name') returns obj.user.name
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? path;
}

/**
 * Replace placeholders in translation string
 * Example: replacePlaceholders("Hello {{name}}", { name: "John" }) returns "Hello John"
 */
function replacePlaceholders(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  return Object.keys(params).reduce((result, key) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    return result.replace(placeholder, String(params[key]));
  }, text);
}

/**
 * Hook for translations
 * Returns a function to get translated strings
 */
export function useTranslation() {
  const { language } = useLanguage();

  /**
   * Get translation for a key
   * @param key - Translation key (supports dot notation)
   * @param params - Optional parameters for placeholder replacement
   * @returns Translated string
   * 
   * @example
   * const { t } = useTranslation();
   * t('common.save') // returns "Save" or "Enregistrer"
   * t('forms.validation.minLength', { min: 8 }) // returns "Minimum 8 characters required"
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);
    return replacePlaceholders(translation, params);
  };

  /**
   * Get translation with count for pluralization
   * @param key - Base translation key
   * @param count - Count for pluralization
   * @param params - Optional parameters
   * @returns Translated string with correct plural form
   * 
   * @example
   * const { tc } = useTranslation();
   * tc('time.minutes_ago', 1) // returns "il y a 1 minute"
   * tc('time.minutes_ago', 5) // returns "il y a 5 minutes"
   */
  const tc = (key: string, count: number, params?: Record<string, string | number>): string => {
    const pluralKey = count > 1 ? `${key}_plural` : key;
    const translation = getNestedValue(translations[language], pluralKey);
    return replacePlaceholders(translation, { count, ...params });
  };

  return {
    t,
    tc,
    language,
  };
}

/**
 * Get translation without hook (for use outside components)
 * @param key - Translation key
 * @param lang - Language code
 * @param params - Optional parameters
 * @returns Translated string
 */
export function translate(
  key: string,
  lang: 'fr' | 'en' = 'fr',
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(translations[lang], key);
  return replacePlaceholders(translation, params);
}

/**
 * Check if a translation key exists
 * @param key - Translation key to check
 * @param lang - Language code
 * @returns True if key exists
 */
export function hasTranslation(key: string, lang: 'fr' | 'en' = 'fr'): boolean {
  const value = getNestedValue(translations[lang], key);
  return value !== key;
}

/**
 * Get all available translation keys
 * @returns Array of all translation keys
 */
export function getAllTranslationKeys(): string[] {
  const keys: string[] = [];
  
  function extractKeys(obj: any, prefix = '') {
    Object.keys(obj).forEach((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractKeys(obj[key], path);
      } else {
        keys.push(path);
      }
    });
  }
  
  extractKeys(frTranslations);
  return keys;
}

/**
 * Validate that all keys exist in both languages
 * @returns Object with missing keys per language
 */
export function validateTranslations(): {
  fr: string[];
  en: string[];
} {
  const frKeys = new Set<string>();
  const enKeys = new Set<string>();
  
  function extractKeys(obj: any, prefix = '', set: Set<string>) {
    Object.keys(obj).forEach((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractKeys(obj[key], path, set);
      } else {
        set.add(path);
      }
    });
  }
  
  extractKeys(frTranslations, '', frKeys);
  extractKeys(enTranslations, '', enKeys);
  
  const missingInFr = Array.from(enKeys).filter(key => !frKeys.has(key));
  const missingInEn = Array.from(frKeys).filter(key => !enKeys.has(key));
  
  return {
    fr: missingInFr,
    en: missingInEn,
  };
}

