import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأكاديمية',
  description: 'تعلم التداول والتحليل المالي من الصفر إلى الاحتراف مع دروس تفاعلية ومصطلحات مالية',
  openGraph: {
    title: 'الأكاديمية',
    description: 'تعلم التداول والتحليل المالي من الصفر إلى الاحتراف مع دروس تفاعلية ومصطلحات مالية',
  },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
