import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأسواق',
  description: 'تتبع أسعار العملات والذهب والنفط والعملات الرقمية مع بيانات حية ومؤشرات المشاعر السوقية',
  openGraph: {
    title: 'الأسواق',
    description: 'تتبع أسعار العملات والذهب والنفط والعملات الرقمية مع بيانات حية ومؤشرات المشاعر السوقية',
  },
};

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
