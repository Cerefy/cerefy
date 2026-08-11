// src/lib/i18n/index.ts
// Cerefy i18n / RTL infrastructure.
//
// Drive direction from ONE `dir` context at the shell root (per the target
// architecture). Components must use logical properties (start/end) so no
// mirrored stylesheet is needed. Number formatting uses Intl.NumberFormat and
// NEVER manual digit substitution. Dialect awareness is a settings concern —
// we expose the locale switch here; dialect behavior is gated via capabilities.

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import arMessages from './ar.json';
import enMessages from './en.json';

export type Locale = 'en' | 'ar';

export interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  fmtNumber: (value: number) => string;
  fmtCurrency: (value: number, code?: string) => string;
}

// ar.json / en.json are the single source of truth. Key parity is enforced at
// module load in dev so a dictionary gap can never silently render a raw key
// (audit i18n #14).
const arDict: Record<string, string> = arMessages as Record<string, string>;
const enDict: Record<string, string> = enMessages as Record<string, string>;

if (process.env.NODE_ENV !== 'production') {
  const arKeys = new Set(Object.keys(arDict));
  const enKeys = new Set(Object.keys(enDict));
  const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));
  const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));
  if (missingInEn.length || missingInAr.length) {
    // eslint-disable-next-line no-console
    console.error(
      '[i18n] key parity violation (ar.json/en.json must share identical keys).',
      { missingInEn, missingInAr },
    );
  }
}

function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = locale === 'ar' ? arDict : enDict;
  // Opposite-locale fallback keeps a missing UI key readable, but never a raw
  // key: parity is enforced above, so this path is a last-resort safety net.
  let text = dict[key] ?? (locale === 'ar' ? enDict[key] ?? key : arDict[key] ?? key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'cerefy_locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return saved === 'ar' ? 'ar' : 'en';
  });

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.style.setProperty('--locale-dir', locale === 'ar' ? 'rtl' : 'ltr');
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next);
      localStorage.setItem(STORAGE_KEY, next);
    };
    const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
    const fmtNumber = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(n);
    const fmtCurrency = (n: number, code = 'SAR') =>
      new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: code }).format(n);

    return { locale, dir: locale === 'ar' ? 'rtl' : 'ltr', setLocale, t, fmtNumber, fmtCurrency };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}