import { Suspense } from 'react';
import ScreenerClient from '@/components/stock-analysis/ScreenerClient';

export const metadata = {
  title: 'Hisse Tarayıcı — Rouaa',
  description: 'En iyi yatırım fırsatlarını bulmak için çok kriterli gelişmiş hisse tarayıcı aracı.',
};

export default function TrStockScreenerPage() {
  return (
    <Suspense>
      <ScreenerClient locale="tr" />
    </Suspense>
  );
}
