import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'مكافحة غسل الأموال',
  description: 'سياسة مكافحة غسل الأموال وتمويل الإرهاب في منصة رؤى',
  openGraph: {
    title: 'مكافحة غسل الأموال',
    description: 'سياسة مكافحة غسل الأموال وتمويل الإرهاب في منصة رؤى',
  },
};

export default function AmlLayout({ children }: { children: React.ReactNode }) {
  return children;
}
