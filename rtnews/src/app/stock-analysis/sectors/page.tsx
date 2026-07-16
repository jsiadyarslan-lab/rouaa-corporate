import { Suspense } from 'react';
import SectorsClient from '@/components/stock-analysis/SectorsClient';

export const metadata = {
  title: 'تحليل القطاعات — رؤى',
  description: 'تحليل شامل لقطاعات السوق مع أداء القطاعات وأقوى الأسهم في كل قطاع.',
};

export default function ArStockSectorsPage() {
  return (
    <Suspense>
      <SectorsClient locale="ar" />
    </Suspense>
  );
}
