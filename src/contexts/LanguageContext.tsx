
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
// Removed: import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text-flow';

type TranslationMap = Record<string, string>; // { key: translation }
type AllTranslations = Record<string, TranslationMap>; // { langCode: TranslationMap }

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  getTranslation: (key: string, defaultText: string) => string; // Now synchronous
  translations: AllTranslations; // Using the new type
  isInitializing: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CURRENT_LANGUAGE_KEY = 'forumverse_current_language';
// Removed: const TRANSLATIONS_KEY = 'forumverse_translations';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  // Add more languages here
];
export { SUPPORTED_LANGUAGES };

// Predefined translations
const PREDEFINED_TRANSLATIONS: AllTranslations = {
  en: {
    // English defaults are usually the 'defaultText' passed to t()
    // but we can define them here for consistency or if keys are abstract
    'navbar.createPost': 'Create Post',
    'navbar.changeLanguage': 'Change language',
    'navbar.selectLanguage': 'Select Language',
    'navbar.logout': 'Log out',
    'navbar.login': 'Login',
    'navbar.signup': 'Sign Up',
    'home.popularThreads': 'Popular Threads',
    'home.createThreadButton': 'Create New Thread',
    'home.loadingThreads': 'Loading threads...',
    'home.noThreads': 'No threads yet.',
    'home.beTheFirst': 'Be the first to start a discussion!',
  },
  vi: {
    'navbar.createPost': 'Tạo Bài Viết',
    'navbar.changeLanguage': 'Thay đổi ngôn ngữ',
    'navbar.selectLanguage': 'Chọn Ngôn Ngữ',
    'navbar.logout': 'Đăng xuất',
    'navbar.login': 'Đăng nhập',
    'navbar.signup': 'Đăng ký',
    'home.popularThreads': 'Chủ đề Nổi bật',
    'home.createThreadButton': 'Tạo Chủ đề Mới',
    'home.loadingThreads': 'Đang tải chủ đề...',
    'home.noThreads': 'Chưa có chủ đề nào.',
    'home.beTheFirst': 'Hãy là người đầu tiên bắt đầu một cuộc thảo luận!',
  }
};


export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  // Initialize translations with predefined ones.
  // In a larger app, these might come from JSON files.
  const [translations, setTranslations] = useState<AllTranslations>(PREDEFINED_TRANSLATIONS);
  const [isInitializing, setIsInitializing] = useState(true);
  // Removed: const [pendingTranslations, setPendingTranslations] = useState<Record<string, Promise<string>>>({});

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(CURRENT_LANGUAGE_KEY);
      if (storedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === storedLanguage)) {
        setCurrentLanguageState(storedLanguage);
      } else {
        localStorage.setItem(CURRENT_LANGUAGE_KEY, 'en'); // Default to English if invalid or not set
      }
      // Removed loading translations from localStorage as they are predefined now
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

  // Removed: saveTranslationsToStorage useCallback

  const getTranslation = useCallback((key: string, defaultText: string): string => {
    if (isInitializing) return defaultText; // Still return default if not initialized
    if (currentLanguage === 'en') {
      // Optionally, you can lookup in PREDEFINED_TRANSLATIONS.en as well
      // or just rely on defaultText being the English version.
      return PREDEFINED_TRANSLATIONS.en[key] || defaultText;
    }

    const langTranslations = translations[currentLanguage];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    
    // Fallback to English or defaultText if translation for the key is missing in the current language
    return PREDEFINED_TRANSLATIONS.en[key] || defaultText;
  }, [currentLanguage, translations, isInitializing]);


  if (isInitializing) {
    return null; // Or a loading spinner for the whole app if preferred
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getTranslation, translations, isInitializing }}>
      {children}
    </LanguageContext.Provider>
  );
};
