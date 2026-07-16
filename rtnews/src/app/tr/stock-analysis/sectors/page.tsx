import { Suspense } from 'react';
import SectorsClient from '@/components/stock-analysis/SectorsClient';

export const metadata = {
  title: 'Sektör Analizi — Rouaa',
  description: 'Performans verileri ve sektörel en iyi hisselerle kapsamlı sektör analizi.',
};

export default function TrStockSectorsPage() {
  return (
    <Suspense>
      <SectorsClient locale="tr" />
    </Suspense>
  );
}
