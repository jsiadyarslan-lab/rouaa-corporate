import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockAnalysisClient from '@/components/stock-analysis/StockAnalysisClient';

export const metadata: Metadata = {
  title: 'تحليل الأسهم — رؤى',
  description: 'تحليلات شاملة للأسهم مدعومة بالذكاء الاصطناعي، الأسهم الأكثر نشاطاً، ملفات الشركات، وأدوات مقارنة لاتخاذ قرارات استثمارية ذكية.',
  keywords: [
    'تحليل أسهم', 'تحليلات اليوم', 'الأسهم الأكثر نشاطاً', 'ملف الشركة',
    'مقارنة الأسهم', 'تحليل ذكاء اصطناعي', 'تقييم الأسهم', 'مؤشرات فنية',
    'إشارات تداول', 'استثمار', 'بورصة',
  ],
  openGraph: {
    title: 'تحليل الأسهم — رؤى',
    description: 'تحليلات شاملة للأسهم ورؤى بالذكاء الاصطناعي. أفضل الأداء، الأكثر نشاطاً، وأدوات مقارنة.',
  },
};

export default function ArStockAnalysisPage() {
  return (
    <Suspense>
      <StockAnalysisClient locale="ar" />
    </Suspense>
  );
}
