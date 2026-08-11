// src/features/ai-workspace/ContextSelectors.tsx
// Region / industry / dialect / language selectors for the AI Workspace.
// Every option comes from a real deterministic catalog (src/intelligence) —
// no invented option lists.

import React from 'react';
import { listMarkets } from '../../intelligence/markets/catalog';
import { listIndustries } from '../../intelligence/industries';
import { useI18n } from '../../lib/i18n';

export interface AIContextSelection {
  language: 'ar' | 'en' | 'both';
  dialect: string;
  marketId: string | null;
  industryId: string | null;
}

export const DEFAULT_SELECTION: AIContextSelection = {
  language: 'both',
  dialect: 'msa',
  marketId: null,
  industryId: null,
};

const DIALECT_OPTIONS = [
  { id: 'msa', label: 'MSA (Arabic)' },
  { id: 'egyptian', label: 'Egyptian (مصري)' },
  { id: 'saudi', label: 'Saudi (سعودي)' },
  { id: 'gulf', label: 'Gulf (خليجي)' },
  { id: 'emirati', label: 'Emirati (إماراتي)' },
  { id: 'levantine', label: 'Levantine (شامي)' },
  { id: 'iraqi', label: 'Iraqi (عراقي)' },
  { id: 'maghrebi', label: 'Maghrebi (مغربي)' },
  { id: 'arabizi', label: 'Arabizi (عربيزي)' },
];

const LANGUAGE_OPTIONS = [
  { id: 'ar', label: 'Arabic preferred' },
  { id: 'en', label: 'English preferred' },
  { id: 'both', label: 'Both (code-switch aware)' },
];

interface SelectProps {
  label: string;
  icon: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, icon, value, options, onChange }) => (
  <label className="block">
    <span className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-label mb-1.5">
      {label}
    </span>
    <span className="relative block">
      <span className="material-symbols-outlined absolute start-2 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 16 }} aria-hidden="true">
        {icon}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-8 py-2 text-sm text-on-surface focus:outline-none focus:border-on-surface transition-colors"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute end-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }} aria-hidden="true">
        expand_more
      </span>
    </span>
  </label>
);

export const ContextSelectors: React.FC<{
  value: AIContextSelection;
  onChange: (next: AIContextSelection) => void;
}> = ({ value, onChange }) => {
  const { t } = useI18n();
  const markets = listMarkets();
  const industries = listIndustries();

  return (
    <div className="bento-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-[15px] font-semibold text-on-surface">Intelligence context</h3>
        <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">deterministic data</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Language"
          icon="translate"
          value={value.language}
          options={LANGUAGE_OPTIONS}
          onChange={(id) => onChange({ ...value, language: id as AIContextSelection['language'] })}
        />
        <Select
          label="Dialect"
          icon="record_voice_over"
          value={value.dialect}
          options={DIALECT_OPTIONS}
          onChange={(dialect) => onChange({ ...value, dialect })}
        />
        <Select
          label="Region"
          icon="public"
          value={value.marketId ?? 'any'}
          options={[
            { id: 'any', label: t('common.anyMenaMarket') },
            ...markets.map((m) => ({ id: m.id, label: m.country })),
          ]}
          onChange={(marketId) => onChange({ ...value, marketId: marketId === 'any' ? null : marketId })}
        />
        <Select
          label="Industry"
          icon="apartment"
          value={value.industryId ?? 'any'}
          options={[
            { id: 'any', label: t('common.anyIndustry') },
            ...industries.map((i) => ({ id: i.id, label: i.name })),
          ]}
          onChange={(industryId) => onChange({ ...value, industryId: industryId === 'any' ? null : industryId })}
        />
      </div>
    </div>
  );
};