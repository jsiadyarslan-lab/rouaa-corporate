import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية وحماية البيانات في منصة رؤى',
  openGraph: {
    title: 'سياسة الخصوصية',
    description: 'سياسة الخصوصية وحماية البيانات في منصة رؤى',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
