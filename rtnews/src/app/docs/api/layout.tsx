import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'توثيق API — رؤى | Rouaa API Docs',
  description: 'توثيق واجهة برمجة التطبيقات العامة لموقع رؤى - أخبار مالية، بيانات أسواق، تقويم اقتصادي',
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
