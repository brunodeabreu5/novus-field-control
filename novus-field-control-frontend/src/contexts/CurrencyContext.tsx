import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatCurrencyValue, getLanguageLocale } from '@/lib/locale';
import type { Currency } from '@/types';

const STORAGE_KEY = 'novus_field_control_currency';

const exchangeRates: Record<Currency, Record<Currency, number>> = {
  PYG: { PYG: 1, BRL: 0.00068, USD: 0.00013 },
  BRL: { PYG: 1470, BRL: 1, USD: 0.19 },
  USD: { PYG: 7700, BRL: 5.26, USD: 1 },
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amount: number, from: Currency) => number;
  format: (amount: number, from?: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function readInitialCurrency(): Currency {
  if (typeof window === 'undefined') {
    return 'PYG';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'PYG' || stored === 'BRL' || stored === 'USD') {
    return stored;
  }

  return 'PYG';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { language } = useTranslation();
  const [currency, setCurrencyState] = useState<Currency>(readInitialCurrency);

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  const value = useMemo<CurrencyContextType>(() => {
    const locale = getLanguageLocale(language);
    const convert = (amount: number, from: Currency) => amount * exchangeRates[from][currency];

    const format = (amount: number, from?: Currency) => {
      const converted = from ? convert(amount, from) : amount;
      return formatCurrencyValue(converted, currency, locale);
    };

    return {
      currency,
      setCurrency,
      convert,
      format,
    };
  }, [currency, language]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
