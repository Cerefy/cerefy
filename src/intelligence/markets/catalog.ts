// src/intelligence/markets/catalog.ts
// MENA market context catalog. Static, configurable, extensible. Adding or
// editing a country here requires NO change to the AI core, prompting, RAG or
// gateway — it is consumed dynamically.

export type MarketDialect =
  | 'msa'
  | 'egyptian'
  | 'saudi'
  | 'gulf'
  | 'emirati'
  | 'levantine'
  | 'iraqi'
  | 'maghrebi';

export interface MarketCurrency {
  code: string;
  /** Optional localized symbol (e.g. 'ر.س'). Not required for logic paths. */
  symbol?: string;
  /** Decimal digit grouping convention (',', '.', or Arabic-Indic digits). */
  format: 'latin' | 'arabic-indic';
}

export type WeekStart = 'sunday' | 'saturday' | 'monday';

export interface Market {
  id: string; // ISO 3166 alpha-2
  country: string;
  countryArabic: string;
  languages: string[];
  primaryLanguage: string;
  dialects: MarketDialect[];
  currency: MarketCurrency;
  /** Common business terminology artifacts the Arabic layer should recognize. */
  terminology?: string[];
  dateConvention: 'DMY' | 'MDY' | 'YMD';
  weekStart: WeekStart;
  dataResidency: string;
  regulatorySources: string[];
  notes?: string;
}

export const MAP_MARKET_CATALOG: Market[] = [
  {
    id: 'SA',
    country: 'Saudi Arabia',
    countryArabic: 'السعودية',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'saudi', 'gulf'],
    currency: { code: 'SAR', symbol: 'ر.س', format: 'latin' },
    terminology: ['موسسه', 'هيئة', 'وزارة', 'شركة', 'جديد'],
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'GCC',
    regulatorySources: ['SAMA', 'CMA', 'ZATCA', 'NDMO'],
  },
  {
    id: 'AE',
    country: 'United Arab Emirates',
    countryArabic: 'الإمارات',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'emirati', 'gulf'],
    currency: { code: 'AED', format: 'latin' },
    terminology: ['إمارة', 'دبي', 'أبوظبي', 'مجلس الوزراء', 'هيئة'],
    dateConvention: 'DMY',
    weekStart: 'monday',
    dataResidency: 'GCC',
    regulatorySources: ['CBUAE', 'DFSA', 'ADGM', 'Dubai Economy'],
  },
  {
    id: 'EG',
    country: 'Egypt',
    countryArabic: 'مصر',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'egyptian'],
    currency: { code: 'EGP', format: 'latin' },
    terminology: ['البنك', 'هيئة الرقابة', 'شركة', 'مصر'],
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'MENA',
    regulatorySources: ['CBE', 'FRA', 'NTRA'],
  },
  {
    id: 'QA',
    country: 'Qatar',
    countryArabic: 'قطر',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'gulf'],
    currency: { code: 'QAR', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'GCC',
    regulatorySources: ['QCB', 'QFDC'],
  },
  {
    id: 'KW',
    country: 'Kuwait',
    countryArabic: 'الكويت',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'gulf'],
    currency: { code: 'KWD', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'GCC',
    regulatorySources: ['CBK', 'CMA'],
  },
  {
    id: 'BH',
    country: 'Bahrain',
    countryArabic: 'البحرين',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'gulf'],
    currency: { code: 'BHD', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'GCC',
    regulatorySources: ['CBB'],
  },
  {
    id: 'OM',
    country: 'Oman',
    countryArabic: 'عمان',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'gulf'],
    currency: { code: 'OMR', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'GCC',
    regulatorySources: ['CBO'],
  },
  {
    id: 'JO',
    country: 'Jordan',
    countryArabic: 'الأردن',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'levantine'],
    currency: { code: 'JOD', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'MENA',
    regulatorySources: ['CBJ', 'JOA'],
  },
  {
    id: 'LB',
    country: 'Lebanon',
    countryArabic: 'لبنان',
    languages: ['ar', 'fr', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'levantine'],
    currency: { code: 'LBP', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'monday',
    dataResidency: 'MENA',
    regulatorySources: ['BDL'],
  },
  {
    id: 'IQ',
    country: 'Iraq',
    countryArabic: 'العراق',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'iraqi'],
    currency: { code: 'IQD', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'sunday',
    dataResidency: 'MENA',
    regulatorySources: ['CBI'],
  },
  {
    id: 'MA',
    country: 'Morocco',
    countryArabic: 'المغرب',
    languages: ['ar', 'fr', 'ber'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'maghrebi'],
    currency: { code: 'MAD', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'monday',
    dataResidency: 'MENA',
    regulatorySources: ['Bank Al-Maghrib', 'AMMC'],
  },
  {
    id: 'DZ',
    country: 'Algeria',
    countryArabic: 'الجزائر',
    languages: ['ar', 'fr'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'maghrebi'],
    currency: { code: 'DZD', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'saturday',
    dataResidency: 'MENA',
    regulatorySources: ['Bank of Algeria'],
  },
  {
    id: 'TN',
    country: 'Tunisia',
    countryArabic: 'تونس',
    languages: ['ar', 'fr'],
    primaryLanguage: 'ar',
    dialects: ['msa', 'maghrebi'],
    currency: { code: 'TND', format: 'latin' },
    dateConvention: 'DMY',
    weekStart: 'monday',
    dataResidency: 'MENA',
    regulatorySources: ['BCT'],
  },
];

export function getMarketById(id: string): Market | undefined {
  return MAP_MARKET_CATALOG.find((m) => m.id.toUpperCase() === id.toUpperCase());
}

export function listMarkets(): Market[] {
  return MAP_MARKET_CATALOG;
}

export function resolveMarketContext(id?: string): Market | undefined {
  return id ? getMarketById(id) : undefined;
}