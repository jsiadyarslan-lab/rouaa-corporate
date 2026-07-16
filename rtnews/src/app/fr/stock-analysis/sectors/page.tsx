import { Suspense } from 'react';
import SectorsClient from '@/components/stock-analysis/SectorsClient';

export const metadata = {
  title: 'Analyse Sectorielle — Rouaa',
  description: 'Analyse sectorielle complète avec données de performance et meilleures actions par secteur.',
};

export default function FrStockSectorsPage() {
  return (
    <Suspense>
      <SectorsClient locale="fr" />
    </Suspense>
  );
}
