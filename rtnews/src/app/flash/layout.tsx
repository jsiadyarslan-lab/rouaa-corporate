import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأخبار العاجلة',
  description: 'آخر الأخبار العاجلة المؤثرة على الأسواق المالية فور حدوثها',
  openGraph: {
    title: 'الأخبار العاجلة',
    description: 'آخر الأخبار العاجلة المؤثرة على الأسواق المالية فور حدوثها',
  },
};

export default function FlashLayout({ children }: { children: React.ReactNode }) {
  return children;
}
