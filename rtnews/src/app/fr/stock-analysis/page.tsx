import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockAnalysisClient from '@/components/stock-analysis/StockAnalysisClient';

export const metadata: Metadata = {
  title: 'Analyse Actions — Rouaa',
  description: "Analyses complètes des actions alimentées par l'IA, actions les plus actives, profils d'entreprise et outils de comparaison pour des décisions d'investissement éclairées.",
  keywords: [
    'analyse actions', 'analyses du jour', 'actions les plus actives', 'profil entreprise',
    'comparer actions', 'analyse IA', 'notation actions', 'capitalisation',
    'indicateurs techniques', 'signaux trading', 'investissement',
  ],
  openGraph: {
    title: 'Analyse Actions — Rouaa',
    description: "Analyses complètes des actions, actions les plus actives, profils d'entreprise et outils de comparaison IA.",
  },
};

export default function FrStockAnalysisPage() {
  return (
    <Suspense>
      <StockAnalysisClient locale="fr" />
    </Suspense>
  );
}
