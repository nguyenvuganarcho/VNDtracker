import { createContext, useContext, useState, type ReactNode } from 'react';
import { en } from './en';
import { vi } from './vi';

export type Language = 'en' | 'vi';
export type CurrencySymbol = 'đ' | '$';

const translations = { en, vi };

const LANGUAGE_STORAGE_KEY = 'language';
const CURRENCY_STORAGE_KEY = 'currencySymbol';

type TranslationKey = keyof typeof en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
  currencySymbol: CurrencySymbol;
  setCurrencySymbol: (symbol: CurrencySymbol) => void;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'vi' ? 'vi' : 'en';
};

// Defaults to VND's own symbol regardless of language -- the app only ever
// tracks VND, so a fresh install should show the true unit rather than
// implying real currency conversion.
const getInitialCurrencySymbol = (): CurrencySymbol => {
  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return stored === '$' ? '$' : 'đ';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [currencySymbol, setCurrencySymbolState] = useState<CurrencySymbol>(getInitialCurrencySymbol);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  // Independent from language on purpose: tying the symbol to EN/VI implied
  // "English = real USD", which it isn't -- this is a display-only choice,
  // never a currency conversion (see currencyNote in en.ts/vi.ts).
  const setCurrencySymbol = (symbol: CurrencySymbol) => {
    setCurrencySymbolState(symbol);
    localStorage.setItem(CURRENCY_STORAGE_KEY, symbol);
  };

  const t = (key: TranslationKey | string): string => {
    return (translations[language] as Record<string, string>)[key] ?? key;
  };

  const formatCurrency = (amount: number): string => `${amount.toLocaleString('en-US')} ${currencySymbol}`;

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, currencySymbol, setCurrencySymbol, formatCurrency }}
    >
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
