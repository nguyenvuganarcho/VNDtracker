import { createContext, useContext, useState, type ReactNode } from 'react';
import { en } from './en';
import { vi } from './vi';

export type Language = 'en' | 'vi';

const translations = { en, vi };

const STORAGE_KEY = 'language';

type TranslationKey = keyof typeof en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'vi' ? 'vi' : 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: TranslationKey | string): string => {
    return (translations[language] as Record<string, string>)[key] ?? key;
  };

  // English shows "$" instead of "đ" -- a cosmetic label swap only, the
  // underlying number is always the VND amount (no real conversion; the
  // app only ever tracks VND, per user's explicit choice).
  const currencySymbol = language === 'vi' ? 'đ' : '$';

  const formatCurrency = (amount: number): string => `${amount.toLocaleString('en-US')} ${currencySymbol}`;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currencySymbol, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
