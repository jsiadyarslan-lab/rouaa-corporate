import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockAnalysisClient from '@/components/stock-analysis/StockAnalysisClient';

export const metadata: Metadata = {
  title: 'Hisse Analizi — Rouaa',
  description: 'Yapay zeka destekli kapsamlı hisse analizleri, en aktif hisseler, şirket profilleri ve bilinçli yatırım kararları için karşılaştırma araçları.',
  keywords: [
    'hisse analizi', 'günlük analizler', 'en aktif hisseler', 'şirket profili',
    'hisse karşılaştırma', 'YZ analizi', 'hisse derecelendirmesi', 'piyasa değeri',
    'teknik göstergeler', 'işlem sinyalleri', 'yatırım',
  ],
  openGraph: {
    title: 'Hisse Analizi — Rouaa',
    description: 'Yapay zeka destekli kapsamlı hisse analizleri, en aktif hisseler, şirket profilleri ve karşılaştırma araçları.',
  },
};

export default function TrStockAnalysisPage() {
  return (
    <Suspense>
      <StockAnalysisClient locale="tr" />
    </Suspense>
  );
}
