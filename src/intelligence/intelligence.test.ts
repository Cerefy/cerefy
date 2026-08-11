/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';

import { stripTashkeel, normalizeArabic, arabicRatio, containsArabic } from './arabic/script';
import { detectArabicDialect } from './arabic/dialect';
import { detectArabizi, analyzeCodeSwitching } from './arabic/arabizi';
import { detectLanguage } from './detect';
import { extractArabicEntities } from './entities';
import { getMarketById, listMarkets, resolveMarketContext } from './markets/catalog';
import { getIndustryById, listIndustries } from './industries';
import { enrichChunkMetadata } from './rag';

test('script: stripTashkeel removes diacritics only', () => {
  assert.equal(stripTashkeel('مُحَمَّد'), 'محمد');
  assert.equal(stripTashkeel('مرحباً بالعالم'), 'مرحبا بالعالم');
});

test('script: normalizeArabic folds alef / teh-marbuta forms', () => {
  assert.equal(normalizeArabic('أحمد'), 'احمد');
  assert.equal(normalizeArabic('مدرسة'), 'مدرسه'); // ة → ه
  assert.equal(normalizeArabic('  b  a  '), 'b a');
});

test('script: arabicRatio is bounded 0..1', () => {
  assert.ok(arabicRatio('مرحبا') > 0.8);
  assert.equal(arabicRatio('hello world'), 0);
  const mixed = arabicRatio('mixed مرحبا text');
  assert.ok(mixed > 0 && mixed < 0.5, `expected 0<ratio<0.5 got ${mixed}`);
});

test('dialect: empty input resolves unknown', () => {
  const d = detectArabicDialect('');
  assert.equal(d.dialect, 'unknown');
});

test('dialect: egyptian markers selected', () => {
  const d = detectArabicDialect('إيه يعني كده فين عايز حاجة');
  assert.equal(d.dialect, 'egyptian');
  assert.ok(d.markers.includes('يعني'));
});

test('dialect: saudi markers identified', () => {
  const d = detectArabicDialect('وش الحين ياخوي تو تجي');
  assert.equal(d.dialect, 'saudi');
});

test('dialect: formal text falls back to msa', () => {
  const d = detectArabicDialect('وفقاً للتقارير الدولية وقعت الشركة اتفاقية استراتيجية');
  assert.equal(d.dialect, 'msa');
});

test('arabizi: known pattern detected', () => {
  const a = detectArabizi('mar7aba shukran kifak');
  assert.equal(a.isArabizi, true);
  assert.ok(a.transliteratedWords.length > 0);
  assert.equal(a.transliteratedWords[0].arabic, 'مرحبا');
});

test('arabizi: plain english not flagged', () => {
  const a = detectArabizi('the quick brown fox');
  assert.equal(a.isArabizi, false);
});

test('code-switching: mixed ar/en detected', () => {
  const c = analyzeCodeSwitching('الاجتماع اليوم في office و meeting الساعة ٣');
  // Latin tokens present + Arabic tokens present => switched
  assert.equal(c.isCodeSwitched, true);
  assert.ok(c.latinWordCount >= 2);
});

test('detect: arabic script text', () => {
  const r = detectLanguage('السلام عليكم ورحمة الله وبركاته');
  assert.equal(r.language, 'ar');
  assert.equal(r.script, 'arabic');
  assert.ok(r.arabicRatio > 0.8);
});

test('detect: empty input is unknown', () => {
  const r = detectLanguage('');
  assert.equal(r.language, 'unknown');
});

test('detect: latin text with arabic-ind digits still identifies script', () => {
  // Mixed-case ensures isCodeSwitched tolerant path
  const r = detectLanguage('arabic number ٣ in latin');
  assert.equal(r.language, 'en');
});

test('entities: extracts ISO currencies + numbers', () => {
  const r = extractArabicEntities('contract 1,500 SAR and ٢٠٠ EGP yearly');
  const currencies = r.entities.filter((e) => e.type === 'currency').map((e) => e.value.toUpperCase());
  assert.ok(currencies.includes('SAR'));
  assert.ok(currencies.includes('EGP'));
  const numbers = r.entities.filter((e) => e.type === 'number');
  assert.ok(numbers.length >= 2);
});

test('entities: arabic-indic digits normalized to latin numbers', () => {
  const r = extractArabicEntities('القيمة ١٢٣٤');
  const numbers = r.entities.filter((e) => e.type === 'number').map((e) => e.value);
  assert.ok(numbers.includes('1234'));
});

test('entities: business terminology detected', () => {
  const r = extractArabicEntities('تم توقيع اتفاقية استثمار مع موردين');
  assert.ok(r.terms.length >= 2);
});

test('markets: catalog has 13 entries and getById works', () => {
  assert.equal(listMarkets().length, 13);
  const sa = getMarketById('SA');
  assert.equal(sa?.currency.code, 'SAR');
  const lower = getMarketById('eg');
  assert.equal(lower?.id, 'EG');
});

test('markets: resolveMarketContext returns undefined for unknown', () => {
  assert.equal(resolveMarketContext('XX'), undefined);
});

test('industries: lookup + count', () => {
  assert.equal(listIndustries().length, 11);
  assert.equal(getIndustryById('banking')?.name, 'Banking');
  assert.equal(getIndustryById('nope'), undefined);
});

test('rag enrichment attaches tenant-scoped arabic metadata', () => {
  const m = enrichChunkMetadata({
    tenantId: 'T1',
    organizationId: 'ORG1',
    country: 'SA',
    industryId: 'banking',
    text: 'حساب ريال سعودي بفائدة ١.٥٪',
  });
  assert.equal(m.language, 'ar');
  assert.equal(m.organizationId, 'ORG1');
  assert.equal(m.country, 'SA');
  assert.ok(m.arabicRatio > 0.8);
  assert.ok(Array.isArray(m.entities));
});