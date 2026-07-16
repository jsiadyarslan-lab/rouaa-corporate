// ─── Public API Documentation Page ────────────────────────────
import type { Metadata } from 'next';
import ApiDocsPageClient from './ApiDocsPageClient';

export const metadata: Metadata = {
  title: 'توثيق API — رؤى | Rouaa API Docs',
  description: 'توثيق واجهة برمجة التطبيقات العامة لموقع رؤى - أخبار مالية، بيانات أسواق، تقويم اقتصادي',
};

export default function ApiDocsPage() {
  return <ApiDocsPageClient />;
}
