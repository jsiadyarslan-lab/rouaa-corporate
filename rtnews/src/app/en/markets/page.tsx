import type { Metadata } from 'next';
import { Suspense } from 'react';
import EnMarketsPageClient from './EnMarketsPageClient';

export const metadata: Metadata = {
  title: 'Markets Center',
  description: 'Track live financial market prices — global indices, commodities, forex, crypto. Real-time data, market sentiment, and AI analysis.',
  keywords: [
    'financial markets', 'stock prices', 'market indices', 'trading', 'forex',
    'gold', 'oil', 'crypto', 'bitcoin', 'cryptocurrency',
    'S&P 500', 'Nasdaq', 'DXY',
  ],
  openGraph: {
    title: 'Markets Center',
    description: 'Track live financial market prices — global indices, commodities, forex, crypto.',
  },
};

export default function EnMarketsPage() {
  return (
    <Suspense>
      <EnMarketsPageClient />
    </Suspense>
  );
}
