// src/intelligence/features/industries.tsx
// MENA Industries page — real industry catalog, dialect-aware terminology
// surfaced per vertical. No fabricated intelligence.

import React from 'react';
import { listIndustries } from '../industries';
import { useI18n } from '../../lib/i18n';
import { StatusPill, Tag } from '../../components/kinetic/primitives';
import { EmptyState } from '../../components/design-system';

export const IndustriesPage: React.FC = () => {
  const { t, fmtNumber } = useI18n();
  const industries = listIndustries();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
            {t('nav.industries')}
          </h2>
          <p className="text-on-surface-variant text-[16px] font-body">
            Vertical context catalog powering tenant-specific terminology and regulatory awareness.
          </p>
        </div>
      </div>

      {industries.length === 0 ? (
        <EmptyState title="No industries configured" description="Add rows to INDUSTRIES to populate this surface." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((ind) => (
            <div key={ind.id} className="bento-card rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-display text-on-surface font-semibold">
                    {ind.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-headline text-[15px] font-semibold text-on-surface leading-tight">
                      {ind.name}
                    </h3>
                    <p className="text-[12px] text-on-surface-variant font-label">{ind.nameArabic}</p>
                  </div>
                </div>
                <StatusPill label={ind.regulatoryDomains.length + ' reg'} variant="neutral" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label">
                  Arabic terminology
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ind.terminology.slice(0, 6).map((term) => (
                    <Tag key={term} label={term} />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label">
                  Regulatory domains
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ind.regulatoryDomains.map((reg) => (
                    <span key={reg} className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label text-[10px] uppercase tracking-wider">
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-on-surface-variant font-label">{fmtNumber(industries.length)} industry verticals</p>
    </div>
  );
};