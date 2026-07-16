import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'اتصل بنا',
  description: 'تواصل مع فريق رؤى للاستفسارات والمقترحات والدعم الفني',
  openGraph: {
    title: 'اتصل بنا',
    description: 'تواصل مع فريق رؤى للاستفسارات والمقترحات والدعم الفني',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
