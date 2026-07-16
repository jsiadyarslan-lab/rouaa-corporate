import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockDetailClient from '@/components/stock-analysis/StockDetailClient';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `تحليل سهم ${symbol} — رؤى`,
    description: `تحليل مفصل بالذكاء الاصطناعي لسهم ${symbol} — مؤشرات فنية، بيانات أساسية، إعداد تداول، ورؤى استثمارية.`,
    openGraph: {
      title: `تحليل سهم ${symbol} — رؤى`,
      description: `تحليل بالذكاء الاصطناعي لسهم ${symbol}`,
    },
  };
}

export default async function ArStockSymbolPage({ params }: PageProps) {
  const { symbol } = await params;
  return (
    <Suspense>
      <StockDetailClient symbol={symbol} locale="ar" />
    </Suspense>
  );
}
