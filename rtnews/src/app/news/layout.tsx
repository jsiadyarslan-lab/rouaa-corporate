import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'مركز الأخبار',
  description: 'آخر الأخبار المالية والاقتصادية في الوقت الفعلي مع تحليلات AI ذكية وتغطية شاملة للأسواق العالمية والعربية',
  openGraph: {
    title: 'مركز الأخبار',
    description: 'آخر الأخبار المالية والاقتصادية في الوقت الفعلي مع تحليلات AI ذكية وتغطية شاملة للأسواق العالمية والعربية',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
