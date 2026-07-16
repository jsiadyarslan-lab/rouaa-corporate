import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockDetailClient from '@/components/stock-analysis/StockDetailClient';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `Analyse ${symbol} — Rouaa`,
    description: `Analyse IA détaillée de l'action ${symbol} — indicateurs techniques, fondamentaux, configuration de trading et insights d'investissement.`,
    openGraph: {
      title: `Analyse ${symbol} — Rouaa`,
      description: `Analyse IA pour ${symbol}`,
    },
  };
}

export default async function FrStockSymbolPage({ params }: PageProps) {
  const { symbol } = await params;
  return (
    <Suspense>
      <StockDetailClient symbol={symbol} locale="fr" />
    </Suspense>
  );
}
