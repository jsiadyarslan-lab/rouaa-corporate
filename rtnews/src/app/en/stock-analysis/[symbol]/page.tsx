import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockDetailClient from '@/components/stock-analysis/StockDetailClient';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol} Stock Analysis — Rouaa`,
    description: `Detailed AI-powered stock analysis for ${symbol} — technical indicators, fundamentals, trade setup, and investment insights.`,
    openGraph: {
      title: `${symbol} Stock Analysis — Rouaa`,
      description: `AI-powered stock analysis for ${symbol}`,
    },
  };
}

export default async function EnStockSymbolPage({ params }: PageProps) {
  const { symbol } = await params;
  return (
    <Suspense>
      <StockDetailClient symbol={symbol} locale="en" />
    </Suspense>
  );
}
