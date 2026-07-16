import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأرشيف',
  description: 'أرشيف شامل للأخبار المالية والاقتصادية مع بحث متقدم',
  openGraph: {
    title: 'الأرشيف',
    description: 'أرشيف شامل للأخبار المالية والاقتصادية مع بحث متقدم',
  },
};

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
