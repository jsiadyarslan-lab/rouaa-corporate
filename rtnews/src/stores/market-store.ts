// ─── Shared Market Data Store ────────────────────────────────
// Single source of truth for prices data across the homepage.
// Eliminates duplicate API calls (TickerBar, HeroSection, HomePageContent
// were all independently fetching /api/markets/prices).

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export { useShallow };

export interface PriceItem {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  category: string;
  decimals: number;
  source?: string;
}

/** Deduplicate an array of PriceItem by symbol, keeping the last occurrence. */
export function deduplicatePrices(prices: PriceItem[]): PriceItem[] {
  const seen = new Map<string, PriceItem>();
  for (const p of prices) {
    seen.set(p.symbol, p);
  }
  return Array.from(seen.values());
}

interface MarketState {
  prices: PriceItem[];
  pricesLoading: boolean;
  pricesLastUpdate: string | null;
  fetchPrices: () => Promise<void>;
}

let pricesFetchInProgress = false;

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: [],
  pricesLoading: true,
  pricesLastUpdate: null,

  fetchPrices: async () => {
    // Prevent duplicate concurrent fetches
    if (pricesFetchInProgress) return;
    pricesFetchInProgress = true;

    try {
      const res = await fetch('/api/markets/prices', { signal: AbortSignal.timeout(15_000) });
      const data = await res.json();
      if (data.prices && data.prices.length > 0) {
        set({
          prices: deduplicatePrices(data.prices),
          pricesLoading: false,
          pricesLastUpdate: data.lastUpdate || new Date().toISOString(),
        });
      } else if (get().pricesLoading) {
        set({ pricesLoading: false });
      }
    } catch {
      if (get().pricesLoading) {
        set({ pricesLoading: false });
      }
    } finally {
      pricesFetchInProgress = false;
    }
  },
}));
