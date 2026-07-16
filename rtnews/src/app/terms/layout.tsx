import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description: 'شروط وأحكام استخدام منصة رؤى للأخبار المالية',
  openGraph: {
    title: 'شروط الاستخدام',
    description: 'شروط وأحكام استخدام منصة رؤى للأخبار المالية',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
