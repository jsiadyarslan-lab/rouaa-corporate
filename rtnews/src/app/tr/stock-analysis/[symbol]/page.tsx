import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockDetailClient from '@/components/stock-analysis/StockDetailClient';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol} Analizi — Rouaa`,
    description: `${symbol} hissesinin detaylı yapay zeka analizi — teknik göstergeler, temel veriler, işlem oluşumu ve yatırım görüşleri.`,
    openGraph: {
      title: `${symbol} Analizi — Rouaa`,
      description: `${symbol} için YZ analizi`,
    },
  };
}

export default async function TrStockSymbolPage({ params }: PageProps) {
  const { symbol } = await params;
  return (
    <Suspense>
      <StockDetailClient symbol={symbol} locale="tr" />
    </Suspense>
  );
}
