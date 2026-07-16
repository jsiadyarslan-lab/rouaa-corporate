import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحليل الفني — رؤى',
  description: 'تحليل فني تفاعلي متقدم مع بيانات السوق الحقيقية',
};

export default function VideoPlayerPage() {
  // Dynamic import client component
  const Client = require('./VideoPlayerPageClient').default;
  return <Client />;
}
