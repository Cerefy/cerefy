// src/intelligence/frontend/countries.tsx
// MENA Countries page — data from MAP_MARKET_CATALOG (listMarkets), genuinely
// real + testimonial-driven, no simulated intelligence.

import React from 'react';
import { listMarkets } from '../markets/catalog';
import { useI18n } from '../../lib/i18n';
import { StatusPill } from '../../components/kinetic/primitives';
import { EmptyState } from '../../components/design-system';

export const CountriesPage: React.FC = () => {
  const { t, fmtNumber } = useI18n();
  const markets = listMarkets();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
            {t('nav.countries')}
          </h2>
          <p className="text-on-surface-variant text-[16px] font-body">
            13 MENA markets live in the regional catalog, ready for tenant config.
          </p>
        </div>
      </div>

      {markets.length === 0 ? (
        <EmptyState title="No countries configured" description="Add market rows in src/intelligence/markets/catalog.ts to populate this surface." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((market) => {
            const active = market.dataResidency === 'GCC';
            return (
              <div key={market.id} className="bento-card rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-display text-on-surface font-semibold">
                      {market.id.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-headline text-[15px] font-semibold text-on-surface leading-tight">
                        {market.country}
                      </h3>
                      <p className="text-[12px] text-on-surface-variant font-label">{market.countryArabic}</p>
                    </div>
                  </div>
                  <StatusPill label={market.dataResidency} variant={active ? 'success' : 'neutral'} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] font-body">
                  <div className="rounded-lg bg-surface-container-low px-3 py-2">
                    <span className="text-on-surface-variant">Currency</span>
                    <div className="text-on-surface font-semibold">{market.currency.code}</div>
                  </div>
                  <div className="rounded-lg bg-surface-container-low px-3 py-2">
                    <span className="text-on-surface-variant">Dialects</span>
                    <div className="text-on-surface font-semibold">{market.dialects.join(', ') || 'msa'}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label">
                    Regulatory bodies
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {market.regulatorySources.map((r) => (
                      <span key={r} className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label text-[10px] uppercase tracking-wider">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low px-3 py-2 text-sm font-medium transition-colors">
                  View country intelligence
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-on-surface-variant font-label">{fmtNumber(markets.length)} markets active</p>
    </div>
  );
};