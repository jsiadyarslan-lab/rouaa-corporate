import { Metadata } from 'next';
import VideosPageClient from './VideosPageClient';

export const metadata: Metadata = {
  title: 'فيديو | رؤى',
  description: 'تحليلات فيديو احترافية للأسواق المالية مع رسوم بيانية متحركة وتعليق صوتي بالذكاء الاصطناعي',
};

export default function VideosPage() {
  return <VideosPageClient />;
}
