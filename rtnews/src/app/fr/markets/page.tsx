import type { Metadata } from 'next';
import { Suspense } from 'react';
import FrMarketsPageClient from './FrMarketsPageClient';

export const metadata: Metadata = {
  title: 'Centre des Marchés',
  description: 'Suivez les prix des marchés financiers en direct — indices mondiaux, matières premières, forex, crypto. Données en temps réel, sentiment du marché et analyses IA.',
  keywords: [
    'marchés financiers', 'cours boursiers', 'indices de marché', 'trading', 'forex',
    'or', 'pétrole', 'crypto', 'bitcoin', 'cryptomonnaie',
    'S&P 500', 'Nasdaq', 'DXY',
  ],
  openGraph: {
    title: 'Centre des Marchés',
    description: 'Suivez les prix des marchés financiers en direct — indices mondiaux, matières premières, forex, crypto.',
  },
};

export default function FrMarketsPage() {
  return (
    <Suspense>
      <FrMarketsPageClient />
    </Suspense>
  );
}
