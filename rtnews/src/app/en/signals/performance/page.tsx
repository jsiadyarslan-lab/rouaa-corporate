import { Metadata } from 'next';
import EnPerformancePageClient from './EnPerformancePageClient';

export const metadata: Metadata = {
  title: 'Signal Performance | Rouaa Financial News',
  description: 'Trading signal performance statistics — win rate, average returns, and performance analysis by category',
  keywords: 'signal performance, win rate, analysis, trading, crypto, forex, commodities',
};

export default function EnPerformancePage() {
  return <EnPerformancePageClient />;
}
