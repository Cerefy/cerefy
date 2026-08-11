// src/intelligence/features/markets.tsx
// MENA Markets page — bento-style market data from the real world catalog
// (MAP_MARKET_CATALOG). No fabricated numbers.

import React from 'react';
import { listMarkets, Market } from '../markets/catalog';
import { useI18n } from '../../lib/i18n';
import { StatusPill } from '../../components/kinetic/primitives';
import { EmptyState } from '../../components/design-system';

export const MarketsPage: React.FC = () => {
  const { t } = useI18n();
  const markets = listMarkets();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
            {t('nav.markets')}
          </h2>
          <p className="text-on-surface-variant text-[16px] font-body">
            Regional market intelligence. Catalog-driven, provider-agnostic, tenant-scoped.
          </p>
        </div>
      </div>

      {markets.length === 0 ? (
        <EmptyState title="No markets in catalog" description="Add rows to MAP_MARKET_CATALOG to light up this surface." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MarketCluster title="GCC Markets" markets={markets.filter((m) => m.dataResidency === 'GCC')} />
          <MarketCluster title="Extended MENA" markets={markets.filter((m) => m.dataResidency !== 'GCC')} />
        </div>
      )}

      <p className="text-xs text-on-surface-variant font-label">
        Dialect-aware markets: {new Set(markets.flatMap((m) => m.dialects)).size} of {markets.length}
      </p>
    </div>
  );
};

const MarketCluster: React.FC<{ title: string; markets: Market[] }> = ({ title, markets }) => (
  <div className="bento-card rounded-xl p-5 space-y-3">
    <h3 className="font-headline text-[15px] font-semibold text-on-surface">{title}</h3>
    {markets.map((m) => (
      <div key={m.id} className="flex items-center justify-between rounded-lg border border-outline-variant/40 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-on-surface font-label text-[11px] uppercase tracking-wider">{m.country}</span>
          <StatusPill label={m.currency.code} variant="neutral" />
          {m.dialects.length > 0 && <StatusPill label={m.dialects[0]} variant="success" />}
        </div>
        <span className="text-[11px] text-on-surface-variant font-label">
          {m.dateConvention} · {m.weekStart}
        </span>
      </div>
    ))}
    {markets.length === 0 && <p className="text-[13px] text-on-surface-variant font-body">No markets in this cluster yet.</p>}
  </div>
);