import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Language } from '@/types';
import es from '@/i18n/es.json';
import pt from '@/i18n/pt.json';
import en from '@/i18n/en.json';

const STORAGE_KEY = 'novus_field_control_language';
const dictionaries: Record<Language, Record<string, unknown>> = { es, pt, en };

export const languageLabels: Record<Language, string> = {
  pt: 'Português',
  es: 'Español',
  en: 'English',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'pt';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'pt' || stored === 'es' || stored === 'en') {
    return stored;
  }

  return 'pt';
}

function lookup(dictionary: Record<string, unknown>, key: string): string | null {
  const keys = key.split('.');
  let value: unknown = dictionary;

  for (const current of keys) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = (value as Record<string, unknown>)[current];
  }

  return typeof value === 'string' ? value : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t: (key: string) => lookup(dictionaries[language], key) ?? lookup(dictionaries.pt, key) ?? key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
