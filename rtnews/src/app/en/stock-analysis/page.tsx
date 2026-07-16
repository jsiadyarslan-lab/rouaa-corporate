import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockAnalysisClient from '@/components/stock-analysis/StockAnalysisClient';

export const metadata: Metadata = {
  title: 'Stock Analysis — Rouaa',
  description: 'AI-powered comprehensive stock analysis, most active stocks, company profiles, and comparison tools for smart investing decisions.',
  keywords: [
    'stock analysis', "today's analyses", 'most active stocks', 'company profile',
    'compare stocks', 'AI analysis', 'stock ratings', 'market cap',
    'technical indicators', 'trading signals', 'investment',
  ],
  openGraph: {
    title: 'Stock Analysis — Rouaa',
    description: 'Comprehensive stock analysis, most active stocks, company profiles, and AI-powered comparison tools.',
  },
};

export default function EnStockAnalysisPage() {
  return (
    <Suspense>
      <StockAnalysisClient locale="en" />
    </Suspense>
  );
}
