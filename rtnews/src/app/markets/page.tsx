import type { Metadata } from 'next';
import { Suspense } from 'react';
import MarketsPageClient from './MarketsPageClient';

export const metadata: Metadata = {
  title: 'مركز الأسواق',
  description: 'تتبع أسعار الأسواق المالية لحظياً — أسواق عربية، سلع، فوركس، عملات رقمية. بيانات حية، مؤشرات الأسواق، وتحليلات AI فورية.',
  keywords: [
    'أسواق مالية', 'أسعار الأسهم', 'مؤشرات عربية', 'تداول', 'فوركس',
    'ذهب', 'نفط', 'عملات رقمية', 'بيتكوين', 'كريبتو',
    'سوق السعودية', 'سوق مصر', 'سوق الإمارات',
    'markets', 'forex', 'commodities', 'crypto',
  ],
  openGraph: {
    title: 'مركز الأسواق',
    description: 'تتبع أسعار الأسواق المالية لحظياً — أسواق عربية، سلع، فوركس، عملات رقمية.',
  },
};

export default function MarketsPage() {
  return (
    <Suspense>
      <MarketsPageClient />
    </Suspense>
  );
}
