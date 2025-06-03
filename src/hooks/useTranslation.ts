
'use client';

import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

interface UseTranslationResult {
  t: (key: string, defaultText: string) => string;
  loadingKey: string | null;
  currentLanguage: string;
}

export const useTranslation = (): UseTranslationResult => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { currentLanguage, getTranslation, translations, isInitializing } = context;
  // This local state is used to trigger re-renders when a specific translation is loaded.
  const [, setForceUpdate] = useState({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const translate = (key: string, defaultText: string): string => {
    if (isInitializing) return defaultText; // Or a loading placeholder like "..."
    if (currentLanguage === 'en') return defaultText;

    const cached = translations[currentLanguage]?.[key];
    if (cached) return cached;

    // If not cached, request translation and return default text or placeholder for now
    // The actual update will happen once getTranslation resolves and updates context
    if (loadingKey !== key) { // Avoid multiple requests for the same key while loading
      setLoadingKey(key);
      getTranslation(key, defaultText)
        // Removed setForceUpdate({}) from here.
        // The useEffect below, which depends on `translations`, will handle re-rendering.
        .finally(() => {
          setLoadingKey(null);
        });
    }
    return defaultText; // Show default text while loading
  };

  // Effect to re-render components when translations or language change globally
  useEffect(() => {
    setForceUpdate({});
  }, [translations, currentLanguage]);


  return { t: translate, loadingKey, currentLanguage };
};

