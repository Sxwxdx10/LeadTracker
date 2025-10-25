'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'fr' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

const STORAGE_KEY = 'leadtracker-language';

export function LanguageProvider({ children, defaultLanguage = 'fr' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;
    
    if (storedLanguage && (storedLanguage === 'fr' || storedLanguage === 'en')) {
      setLanguageState(storedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (browserLang === 'fr' || browserLang === 'en') {
        setLanguageState(browserLang);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  };

  // Set initial HTML lang attribute
  useEffect(() => {
    if (isInitialized) {
      document.documentElement.lang = language;
    }
  }, [language, isInitialized]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    availableLanguages: ['fr', 'en'],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
}

