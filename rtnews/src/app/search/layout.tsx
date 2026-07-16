import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'البحث الدلالي',
  description: 'ابحث في الأخبار والتحليلات والمقالات المالية بذكاء',
  openGraph: {
    title: 'البحث الدلالي',
    description: 'ابحث في الأخبار والتحليلات والمقالات المالية بذكاء',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
