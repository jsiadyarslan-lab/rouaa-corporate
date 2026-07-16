import { Suspense } from 'react';
import SectorsClient from '@/components/stock-analysis/SectorsClient';

export const metadata = {
  title: 'Sector Analysis — Rouaa',
  description: 'Comprehensive sector analysis with performance data and top stocks in each sector.',
};

export default function EnStockSectorsPage() {
  return (
    <Suspense>
      <SectorsClient locale="en" />
    </Suspense>
  );
}
