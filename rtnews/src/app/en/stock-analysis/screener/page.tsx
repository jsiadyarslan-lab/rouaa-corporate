import { Suspense } from 'react';
import ScreenerClient from '@/components/stock-analysis/ScreenerClient';

export const metadata = {
  title: 'Stock Scanner — Rouaa',
  description: 'Advanced stock scanning tool with multiple filters to find the best investment opportunities.',
};

export default function EnStockScreenerPage() {
  return (
    <Suspense>
      <ScreenerClient locale="en" />
    </Suspense>
  );
}
