// src/intelligence/markets/index.ts
// Market context registry — facade over the static catalog.

import { MAP_MARKET_CATALOG, Market, getMarketById, listMarkets, resolveMarketContext } from './catalog';

export type { Market, MarketDialect, MarketCurrency, WeekStart } from './catalog';

export { MAP_MARKET_CATALOG, getMarketById, listMarkets, resolveMarketContext } from './catalog';

export default MAP_MARKET_CATALOG;