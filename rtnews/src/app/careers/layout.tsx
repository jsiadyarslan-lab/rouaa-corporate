import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الوظائف',
  description: 'انضم لفريق رؤى وساهم في بناء مستقبل الإعلام المالي العربي',
  openGraph: {
    title: 'الوظائف',
    description: 'انضم لفريق رؤى وساهم في بناء مستقبل الإعلام المالي العربي',
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
