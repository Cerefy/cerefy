// src/intelligence/industries/index.ts
// Industry context catalog — configurable, extensible. Organizations select
// Country + Industry + Language + Dialect. Adding an industry here does not
// touch the AI core.

export interface Industry {
  id: string;
  name: string;
  nameArabic: string;
  /** Arabic business terminology specific to the industry. */
  terminology: string[];
  /** Regulatory / compliance knowledge areas (names only — never legal advice). */
  regulatoryDomains: string[];
  entities: string[]; // common entity labels in this vertical
}

export const INDUSTRIES: Industry[] = [
  {
    id: 'banking',
    name: 'Banking',
    nameArabic: 'البنوك',
    terminology: ['حساب', 'قرض', 'تمويل', 'مصرف', 'سداد', 'فائدة', 'ائتمان', 'ودائع'],
    regulatoryDomains: ['SAMA Banking Rules', 'CBUAE Consumer Protection', 'CBE Circulars', 'Basel III reporting'],
    entities: ['بنك', 'مصرف', 'قرض', 'حساب', 'فائدة', 'سند'],
  },
  {
    id: 'finance',
    name: 'Finance',
    nameArabic: 'المالية',
    terminology: ['ميزانية', 'إيرادات', 'مصروفات', 'أرباح', 'خسائر', 'سيولة', 'رأس المال'],
    regulatoryDomains: ['IFRS', 'ZATCA VAT', 'Financial reporting', 'Zakat & tax'],
    entities: ['ميزانية', 'إيرادات', 'أرباح', 'سيولة', 'تقرير مالي'],
  },
  {
    id: 'retail',
    name: 'Retail',
    nameArabic: 'التجزئة',
    terminology: ['مخزون', 'عروض', 'مبيعات', 'عملاء', 'سلسلة توريد', 'متجر', 'أسعار'],
    regulatoryDomains: ['Consumer protection', 'e-Commerce regulation', 'Pricing compliance'],
    entities: ['متجر', 'مخزون', 'عملاء', 'مبيعات', 'عرض'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    nameArabic: 'الصحة',
    terminology: ['مستشفى', 'رعاية', 'مريض', 'طبيب', 'علاج', 'تأمين صحي', 'سجل طبي'],
    regulatoryDomains: ['MOH licensing', 'Health data privacy', 'Saudi Health Law', 'HIPAA-like local rules'],
    entities: ['مستشفى', 'طبيب', 'مريض', 'علاج', 'تأمين صحي'],
  },
  {
    id: 'government',
    name: 'Government',
    nameArabic: 'الحكومة',
    terminology: ['خدمة حكومية', 'وزارة', 'هيئة', 'منصة', 'قرار', 'مرسوم', 'أتمتة'],
    regulatoryDomains: ['NDMO', 'e-Government policies', 'Cybersecurity framework', 'Public records'],
    entities: ['وزارة', 'هيئة', 'منصة', 'قرار', 'خدمة'],
  },
  {
    id: 'telecom',
    name: 'Telecom',
    nameArabic: 'الاتصالات',
    terminology: ['شبكة', 'اشتراك', 'بيانات', 'تغطية', 'خطة', 'عملاء', 'باقة'],
    regulatoryDomains: ['CITC spectrum', 'TDRA consumer', 'NRA rules'],
    entities: ['شبكة', 'اشتراك', 'باقة', 'عملاء', 'تغطية'],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    nameArabic: 'العقارات',
    terminology: ['عقار', 'إيجار', 'تمليك', 'ضريبة', 'صيانة', 'مشروع سكني', 'تقييم'],
    regulatoryDomains: ['REGA licensing', 'Mortgage law', 'RE broker regulation'],
    entities: ['عقار', 'إيجار', 'تمليك', 'مشروع سكني', 'تقييم'],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    nameArabic: 'التصنيع',
    terminology: ['إنتاج', 'مصنع', 'جودة', 'صيانة', 'خام', 'معدات', 'تشغيل'],
    regulatoryDomains: ['ISO 9001', 'Industrial licenses', 'SASO standards'],
    entities: ['مصنع', 'إنتاج', 'جودة', 'خام', 'معدات'],
  },
  {
    id: 'logistics',
    name: 'Logistics',
    nameArabic: 'اللوجستيات',
    terminology: ['شحن', 'توصيل', 'مستودع', 'مسار', 'تتبع', 'أسطول', 'تخليص'],
    regulatoryDomains: ['Customs rules', 'Transport licensing', 'e-commerce delivery'],
    entities: ['شحن', 'مستودع', 'أسطول', 'توصيل', 'مسار'],
  },
  {
    id: 'education',
    name: 'Education',
    nameArabic: 'التعليم',
    terminology: ['مدرسة', 'جامعة', 'منهج', 'طالب', 'درجات', 'اعتماد', 'تدريب'],
    regulatoryDomains: ['MOE accreditation', 'Saudi National Qualifications', 'Data privacy for students'],
    entities: ['مدرسة', 'جامعة', 'طالب', 'منهج', 'درجات'],
  },
  {
    id: 'energy',
    name: 'Energy',
    nameArabic: 'الطاقة',
    terminology: ['طاقة', 'نفط', 'غاز', 'كهرباء', 'استكشاف', 'إنتاج', 'تكرير'],
    regulatoryDomains: ['Saudi Energy Law', 'Ministry of Energy policies', 'Emissions reporting'],
    entities: ['طاقة', 'نفط', 'غاز', 'كهرباء', 'إنتاج'],
  },
];

export function getIndustryById(id: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

export function listIndustries(): Industry[] {
  return INDUSTRIES;
}

export function industryCount(): number {
  return INDUSTRIES.length;
}

export function getIndustryTerminology(id: string): string[] {
  const ind = getIndustryById(id);
  return ind ? ind.terminology : [];
}