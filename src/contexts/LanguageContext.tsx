
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { PREDEFINED_TRANSLATIONS_EN, PREDEFINED_TRANSLATIONS_VI } from '@/lib/translations-vi'; // Assuming VI translations are also in a separate file or combined

type TranslationMap = Record<string, string>; 
type AllTranslations = Record<string, TranslationMap>; 

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  getTranslation: (key: string, defaultText: string, args?: Record<string, string | number>) => string;
  translations: AllTranslations;
  isInitializing: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CURRENT_LANGUAGE_KEY = 'forumverse_current_language';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];
export { SUPPORTED_LANGUAGES };

// Combine imported translations
const PREDEFINED_TRANSLATIONS: AllTranslations = {
  en: PREDEFINED_TRANSLATIONS_EN,
  vi: PREDEFINED_TRANSLATIONS_VI,
};


export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [translations] = useState<AllTranslations>(PREDEFINED_TRANSLATIONS);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(CURRENT_LANGUAGE_KEY);
      if (storedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === storedLanguage)) {
        setCurrentLanguageState(storedLanguage);
      } else {
        localStorage.setItem(CURRENT_LANGUAGE_KEY, 'en'); 
      }
    } catch (error) {
      console.error("Failed to load language settings from localStorage", error);
      setCurrentLanguageState('en');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      setCurrentLanguageState(lang);
      try {
        localStorage.setItem(CURRENT_LANGUAGE_KEY, lang);
      } catch (error) {
        console.error("Failed to save current language to localStorage", error);
      }
    } else {
      console.warn(`Attempted to set unsupported language: ${lang}`);
    }
  }, []);

  const getTranslation = useCallback((key: string, defaultText: string, args?: Record<string, string | number>): string => {
    if (isInitializing) return defaultText; 
    
    let textToTranslate = defaultText;
    const langTranslations = translations[currentLanguage];

    if (langTranslations && langTranslations[key] !== undefined) {
      textToTranslate = langTranslations[key];
    } else if (currentLanguage !== 'en' && translations.en && translations.en[key] !== undefined) {
      textToTranslate = translations.en[key];
    }
    
    if (args) {
      Object.keys(args).forEach(argKey => {
        const regex = new RegExp(`{${argKey}}`, 'g');
        textToTranslate = textToTranslate.replace(regex, String(args[argKey]));
      });
    }
    return textToTranslate;
  }, [currentLanguage, translations, isInitializing]);


  if (isInitializing) {
    return null; 
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getTranslation, translations, isInitializing }}>
      {children}
    </LanguageContext.Provider>
  );
};
