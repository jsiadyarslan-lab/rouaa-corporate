import type { Metadata } from 'next';
import { Suspense } from 'react';
import TrMarketsPageClient from './TrMarketsPageClient';

export const metadata: Metadata = {
  title: 'Piyasa Merkezi',
  description: 'Finansal piyasa fiyatlarını canlı takip edin — küresel endeksler, emtalar, forex, kripto. Gerçek zamanlı veriler, piyasa duyarlılığı ve yapay zeka analizleri.',
  keywords: [
    'finansal piyasalar', 'borsa fiyatları', 'piyasa endeksleri', 'trading', 'forex',
    'altın', 'petrol', 'kripto', 'bitcoin', 'kripto para',
    'S&P 500', 'Nasdaq', 'DXY',
  ],
  openGraph: {
    title: 'Piyasa Merkezi',
    description: 'Finansal piyasa fiyatlarını canlı takip edin — küresel endeksler, emtalar, forex, kripto.',
  },
};

export default function TrMarketsPage() {
  return (
    <Suspense>
      <TrMarketsPageClient />
    </Suspense>
  );
}
