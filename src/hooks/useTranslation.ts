
'use client';

import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

interface UseTranslationResult {
  t: (key: string, defaultText: string) => string;
  loadingKey: string | null; // Represents a key whose translation is actively being fetched by this hook instance
  currentLanguage: string;
}

export const useTranslation = (): UseTranslationResult => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { currentLanguage, getTranslation, translations, isInitializing } = context;
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const translate = (key: string, defaultText: string): string => {
    if (isInitializing) return defaultText; 
    if (currentLanguage === 'en') return defaultText;

    const cached = translations[currentLanguage]?.[key];
    if (cached) return cached;

    // If not cached, request translation.
    // The loadingKey state here is mostly to signal to *this specific hook instance*
    // if it has initiated a fetch for *this specific key* in the current render cycle.
    // The LanguageContext handles broader pending state.
    if (loadingKey !== key) { 
      setLoadingKey(key);
      getTranslation(key, defaultText)
        .finally(() => {
          // Only clear loadingKey if it's still the one this promise was for.
          // This helps if multiple t() calls happen rapidly for different keys.
          setLoadingKey(prevLoadingKey => (prevLoadingKey === key ? null : prevLoadingKey));
        });
    }
    // Always return defaultText while the actual translation is loading.
    // The component will re-render once LanguageContext updates `translations`.
    return defaultText; 
  };

  // Components using this hook will re-render when `translations` or `currentLanguage`
  // from the context changes, due to the nature of `useContext`.
  // No explicit forceUpdate or useEffect for that purpose is needed here.

  return { t: translate, loadingKey, currentLanguage };
};
