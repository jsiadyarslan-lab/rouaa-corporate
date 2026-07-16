import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'التقويم الاقتصادي',
  description: 'تتبع الأحداث الاقتصادية العالمية مع عداد تنازلي وتحليلات التأثير على الأسواق',
  openGraph: {
    title: 'التقويم الاقتصادي',
    description: 'تتبع الأحداث الاقتصادية العالمية مع عداد تنازلي وتحليلات التأثير على الأسواق',
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
