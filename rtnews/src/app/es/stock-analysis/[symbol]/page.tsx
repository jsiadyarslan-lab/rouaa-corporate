import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockDetailClient from '@/components/stock-analysis/StockDetailClient';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `Análisis de ${symbol} — Rouaa`,
    description: `Análisis detallado de acciones con IA para ${symbol} — indicadores técnicos, fundamentales, configuración de operaciones e información de inversión.`,
    openGraph: {
      title: `Análisis de ${symbol} — Rouaa`,
      description: `Análisis de acciones con IA para ${symbol}`,
    },
  };
}

export default async function EsStockSymbolPage({ params }: PageProps) {
  const { symbol } = await params;
  return (
    <Suspense>
      <StockDetailClient symbol={symbol} locale="es" />
    </Suspense>
  );
}
