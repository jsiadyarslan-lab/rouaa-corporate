import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'التحليلات',
  description: 'تحليلات AI ذكية للأسواق المالية مع مؤشرات المشاعر والتوصيات المبنية على البيانات',
  openGraph: {
    title: 'التحليلات',
    description: 'تحليلات AI ذكية للأسواق المالية مع مؤشرات المشاعر والتوصيات المبنية على البيانات',
  },
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
