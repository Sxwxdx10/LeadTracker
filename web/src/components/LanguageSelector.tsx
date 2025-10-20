'use client';

import * as React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Language labels
const languageLabels: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
};

// Language flags (emoji)
const languageFlags: Record<Language, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline';
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showLabel = true,
  showFlag = true,
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, lang?: Language) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (lang) {
        handleLanguageChange(lang);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  // Inline variant - simple buttons
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            onKeyDown={(e) => handleKeyDown(e, lang)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              language === lang
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
            aria-label={`Switch to ${languageLabels[lang]}`}
            aria-current={language === lang ? 'true' : 'false'}
          >
            {showFlag && (
              <span className="text-lg" aria-hidden="true">
                {languageFlags[lang]}
              </span>
            )}
            {showLabel && <span>{languageLabels[lang]}</span>}
            {language === lang && (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
          'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {showFlag && (
          <span className="text-base" aria-hidden="true">
            {languageFlags[language]}
          </span>
        )}
        {showLabel && <span>{languageLabels[language]}</span>}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-48 rounded-md shadow-lg',
            'bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5',
            'z-50'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                onKeyDown={(e) => handleKeyDown(e, lang)}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-2 text-sm',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700',
                  language === lang
                    ? 'text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                )}
                role="menuitem"
                aria-current={language === lang ? 'true' : 'false'}
              >
                <div className="flex items-center gap-3">
                  {showFlag && (
                    <span className="text-lg" aria-hidden="true">
                      {languageFlags[lang]}
                    </span>
                  )}
                  <span>{languageLabels[lang]}</span>
                </div>
                {language === lang && (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for navbar
export function LanguageSelectorCompact() {
  const { language, setLanguage, availableLanguages } = useLanguage();

  const toggleLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    const nextLanguage = availableLanguages[nextIndex];
    if (nextLanguage) {
      setLanguage(nextLanguage);
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-md',
        'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'transition-colors'
      )}
      aria-label={`Current language: ${languageLabels[language]}. Click to switch.`}
      title={`Switch language (Current: ${languageLabels[language]})`}
    >
      <span className="text-xl" aria-hidden="true">
        {languageFlags[language]}
      </span>
    </button>
  );
}

// Mobile-friendly version
export function LanguageSelectorMobile() {
  return (
    <LanguageSelector
      variant="inline"
      showLabel={true}
      showFlag={true}
      className="w-full"
    />
  );
}

