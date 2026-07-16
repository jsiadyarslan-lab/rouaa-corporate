import { Suspense } from 'react';
import ScreenerClient from '@/components/stock-analysis/ScreenerClient';

export const metadata = {
  title: 'Scanner Boursier — Rouaa',
  description: "Outil avancé de scan boursier avec plusieurs critères pour trouver les meilleures opportunités d'investissement.",
};

export default function FrStockScreenerPage() {
  return (
    <Suspense>
      <ScreenerClient locale="fr" />
    </Suspense>
  );
}
