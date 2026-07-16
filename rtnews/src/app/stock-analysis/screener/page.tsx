import { Suspense } from 'react';
import ScreenerClient from '@/components/stock-analysis/ScreenerClient';

export const metadata = {
  title: 'ماسح الأسهم — رؤى',
  description: 'أداة مسح الأسهم المتقدمة مع فلاتر متعددة للعثور على أفضل الفرص الاستثمارية.',
};

export default function ArStockScreenerPage() {
  return (
    <Suspense>
      <ScreenerClient locale="ar" />
    </Suspense>
  );
}
