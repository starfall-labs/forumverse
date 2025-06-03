
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text-flow';

type Translations = Record<string, Record<string, string>>; // { langCode: { key: translation } }

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  getTranslation: (key: string, defaultText: string) => Promise<string>;
  translations: Translations;
  isInitializing: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CURRENT_LANGUAGE_KEY = 'forumverse_current_language';
const TRANSLATIONS_KEY = 'forumverse_translations';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  // Add more languages here
];
export { SUPPORTED_LANGUAGES };


export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, Promise<string>>>({});

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(CURRENT_LANGUAGE_KEY);
      if (storedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === storedLanguage)) {
        setCurrentLanguageState(storedLanguage);
      } else {
        localStorage.setItem(CURRENT_LANGUAGE_KEY, 'en'); // Default to English if invalid or not set
      }

      const storedTranslations = localStorage.getItem(TRANSLATIONS_KEY);
      if (storedTranslations) {
        setTranslations(JSON.parse(storedTranslations));
      }
    } catch (error) {
      console.error("Failed to load language settings from localStorage", error);
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

  const saveTranslationsToStorage = useCallback((newTranslations: Translations) => {
     try {
        localStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(newTranslations));
      } catch (error) {
        console.error("Failed to save translations to localStorage", error);
      }
  }, []);

  const getTranslation = useCallback(async (key: string, defaultText: string): Promise<string> => {
    if (currentLanguage === 'en') {
      return defaultText;
    }

    const cachedTranslation = translations[currentLanguage]?.[key];
    if (cachedTranslation) {
      return cachedTranslation;
    }

    const pendingKey = `${currentLanguage}:${key}`;
    if (pendingTranslations[pendingKey]) {
      return pendingTranslations[pendingKey];
    }

    const translationPromise = (async () => {
      try {
        const result = await translateText({ textToTranslate: defaultText, targetLanguageCode: currentLanguage });
        const newTranslation = result.translatedText;

        // Defer the state update to the next microtask
        Promise.resolve().then(() => {
          setTranslations(prev => {
            const updatedLangTranslations = { ...prev[currentLanguage], [key]: newTranslation };
            const newTranslations = { ...prev, [currentLanguage]: updatedLangTranslations };
            saveTranslationsToStorage(newTranslations);
            return newTranslations;
          });
        });
        return newTranslation;
      } catch (error) {
        console.error(`Error translating "${key}" to ${currentLanguage}:`, error);
        return defaultText; // Fallback to default text on error
      } finally {
        setPendingTranslations(prev => {
          const updated = { ...prev };
          delete updated[pendingKey];
          return updated;
        });
      }
    })();

    setPendingTranslations(prev => ({ ...prev, [pendingKey]: translationPromise }));
    return translationPromise;

  }, [currentLanguage, translations, saveTranslationsToStorage, pendingTranslations]);


  if (isInitializing) {
    return null; // Or a loading spinner for the whole app if preferred
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getTranslation, translations, isInitializing }}>
      {children}
    </LanguageContext.Provider>
  );
};
