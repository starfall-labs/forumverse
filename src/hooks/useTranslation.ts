
'use client';

import { useContext } from 'react'; // Removed useState, useEffect
import { LanguageContext } from '@/contexts/LanguageContext';

interface UseTranslationResult {
  t: (key: string, defaultText: string) => string;
  currentLanguage: string;
  isInitializing: boolean; // Keep this to allow components to handle loading state
}

export const useTranslation = (): UseTranslationResult => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { currentLanguage, getTranslation, isInitializing } = context;

  // The `t` function is now simpler as getTranslation is synchronous
  const translate = (key: string, defaultText: string): string => {
    return getTranslation(key, defaultText);
  };

  return { t: translate, currentLanguage, isInitializing };
};
