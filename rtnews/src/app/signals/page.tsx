import { Metadata } from 'next';
import SignalsPageClient from './SignalsPageClient';

export const metadata: Metadata = {
  title: 'إشارات التداول',
  description: 'توصيات تداول ذكية مدعومة بالذكاء الاصطناعي — إشارات شراء وبيع مباشرة مع مستويات الدخول ووقف الخسارة وجني الأرباح',
  keywords: 'إشارات تداول, توصيات, ذكاء اصطناعي, شراء, بيع, عملات رقمية, فوركس, سلع',
};

export default function SignalsPage() {
  return <SignalsPageClient />;
}
