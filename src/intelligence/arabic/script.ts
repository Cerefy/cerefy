// src/intelligence/arabic/script.ts
// Arabic script & Unicode helpers — deterministic, testable, no external deps.

// Unicode ranges
export const ARABIC_RANGE = /[\u0600-\u06FF]/;
export const ARABIC_PRESENTATION_A = /[\uFB50-\uFDFF]/;
export const ARABIC_PRESENTATION_B = /[\uFE70-\uFEFF]/;
export const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/; // ٠-٩
export const EXTENDED_ARABIC_INDIC_DIGITS = /[\u06F0-\u06F9]/; // ۰-۹

// Persian / Urdu / Pashto letters that are NOT standard MSA Arabic
export const NON_MSA_LETTERS = /[\u06A9\u06AF\u06CC\u06C0\u067E\u0686\u0698\u0687\u0690\u06D2]/u;

// Core dialect / language detection markers
// Egyptian
export const EGYPTIAN_MARKERS = [
  'إيه', 'ايه', 'لسه', 'عندك', 'يعني', 'كده', 'حد', 'حاجة', 'معلش', 'خالص', 'بس', 'إزاي',
  'ازيك', 'عليك', 'مش', 'عايز', 'عاوز', 'مين', 'فين', 'قوي', 'كويس', 'طيب', 'زي',
];
// Gulf / Saudi / Emirati
export const GULF_MARKERS = [
  'وش', 'وش', 'بس', 'عقب', 'ويا', 'ليش', 'الحين', 'لحين', 'خذ', 'قسيم', 'غب', 'شلون',
  'الليلة', 'والله', 'مب', 'مافيه', 'توي', 'همم', 'ذا', 'ذيك', 'يبه', 'ابو',
];
// Levantine
export const LEVANTINE_MARKERS = [
  'شو', 'شلون', 'عنجد', 'كتير', 'مبارح', 'هلق', 'بيش', 'إيمتا', 'مي', 'كيفك', 'متل',
  'مشان', 'هدول', 'هيك', 'وين', 'قديش', 'بس',
];
// Iraqi
export const IRAQI_MARKERS = [
  'شلون', 'وین', 'هسه', 'مو', 'اشون', 'عفت', 'دليك', 'يا ولي', 'تريد', 'كد', 'أوكي',
];
// Maghrebi
export const MAGHREBI_MARKERS = [
  'اش', 'دaba', 'شنو', 'اشبيك', 'علاش', 'وين', 'هذا', 'حتي', 'واش', 'ديك', 'قبل', 'الفاس',
];
// Yemeni
export const YEMENI_MARKERS = [];
// Standard MSA indicators
export const MSA_MARKERS = [
  'الدولي', 'الاقتصادية', 'الإستراتيجي', 'دولية', 'وقعت', 'توقيع', 'بشكل رسمي', 'نظراً',
  'وفقاً', 'بالإضافة', 'منذ', 'عقد', 'ولكن', 'بينما', 'وتقوم',
];

// Very selective Arabizi latinizations of common Arabic words/phrases
export const ARABIZI_PATTERNS: Record<string, string> = {
  'mar7aba': 'مرحبا',
  'marhaba': 'مرحبا',
  'shukran': 'شكرا',
  'shukraan': 'شكرا',
  'kifak': 'كيفك',
  'kifik': 'كيفك',
  'izzayak': 'إزيك',
  'la': 'لا',
  'naam': 'نعم',
  'keif': 'كيف',
  'wayn': 'وین',
  'aywa': 'أيوا',
  'eh': 'إيه',
  'bass': 'بس',
  'mabrook': 'مبروك',
  '7elwa': 'حلوة',
  '3am': 'عام',
  'wala': 'والا',
  'ama': 'إلا',
  'enta': 'إنت',
  'inti': 'إنتي',
  'mish': 'مش',
};

// Normalize Arabic text for deterministic comparison (retains dialect markers).
export function stripTashkeel(text: string): string {
  return text.replace(/[\u064B-\u0652\u0670\u0640]/g, '');
}

export function normalizeArabic(text: string): string {
  return (
    text
      // normalize alef forms
      .replace(/[\u0622\u0623\u0625]/g, '\u0627') // آ أ إ → ا
      // normalize teh marbutah → heh
      .replace(/\u0629/g, '\u0647')
      // normalize dagger alef, waw hamza, yah hamza
      .replace(/\u0671/g, '\u0627')
      .replace(/\u0624/g, '\u0648')
      .replace(/\u0626/g, '\u064A')
      .replace(/\u0649/g, '\u064A') // alef maksura → yah
      .replace(/\u0640/g, '') // tatweel
      // remove diacritics & sukun
      .replace(/[\u064B-\u0652]/g, '')
      // collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// Percent of Arabic-script characters within a string.
export function arabicRatio(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const chars = text.replace(/\s/g, '');
  if (chars.length === 0) return 0;
  let arabic = 0;
  for (const ch of chars) {
    if (ARABIC_RANGE.test(ch) || ARABIC_PRESENTATION_A.test(ch) || ARABIC_PRESENTATION_B.test(ch)) arabic++;
  }
  return arabic / chars.length;
}

export function countArabicWords(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  return words.filter((w) => arabicRatio(w) > 0.5).length;
}

export function containsArabic(text: string): boolean {
  // Letters only — Arabic-Indic digits (٠-٩) and extended digits (۰-۹) are
  // numerals, not script, so they must not mark a string as Arabic.
  const lettersOnly = text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, '');
  return ARABIC_RANGE.test(lettersOnly);
}

// Count how many Arabic letters are squeezed between Latin-script letters —
// a rough indicator of Arabic/English code-switching within a single word.
export function countMixedWordBoundaries(text: string): number {
  const tokens = text.split(/[\s.،؛!?()[]]/);
  let switches = 0;
  for (const token of tokens) {
    const hasArabic = ARABIC_RANGE.test(token);
    const hasLatin = /[a-zA-Z]/.test(token);
    if (hasArabic && hasLatin) switches++;
  }
  return switches;
}

// Default export of identities for tests/tooling
export const ARABIC_RANGE_SOURCE = ARABIC_RANGE.toString();