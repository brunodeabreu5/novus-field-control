import type { Currency, Language } from '@/types';

export const languageLocales: Record<Language, string> = {
  pt: 'pt-BR',
  es: 'es-PY',
  en: 'en-US',
};

export const currencySymbols: Record<Currency, string> = {
  PYG: '₲',
  BRL: 'R$',
  USD: '$',
};

export function getLanguageLocale(language: Language): string {
  return languageLocales[language];
}

export function formatCurrencyValue(amount: number, currency: Currency, locale: string): string {
  const symbol = currencySymbols[currency];

  if (currency === 'PYG') {
    return `${symbol} ${Math.round(amount).toLocaleString(locale)}`;
  }

  return `${symbol} ${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(value: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
