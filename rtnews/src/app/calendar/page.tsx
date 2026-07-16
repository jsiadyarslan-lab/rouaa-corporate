import type { Metadata } from 'next';
import SmartCalendarCenter from '@/components/calendar/SmartCalendarCenter';

// CRITICAL: force-dynamic prevents ISR caching. The calendar page must
// always render fresh HTML on every request — otherwise users may see
// a stale cached version (e.g. old news page from before the redesign).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'مركز التخطيط الاقتصادي',
  description: 'تقويم اقتصادي ذكي — أحداث مؤثرة، بيانات NFP و CPI و GDP، مواعيد البنوك المركزية، وتوقعات الأسواق المالية لحظياً مع مؤشر رؤى المسبق للتأثير ومصفوفة تأثير الأصول.',
  keywords: [
    'تقويم اقتصادي', 'أجندة اقتصادية', 'NFP', 'CPI', 'GDP', 'FOMC',
    'البنك الفيدرالي', 'البنك المركزي الأوروبي', 'بنك إنجلترا',
    'أحداث اقتصادية', 'تأثير مرتفع', 'بيانات أمريكية',
    'economic calendar', 'forex calendar', 'market events',
  ],
  openGraph: {
    title: 'مركز التخطيط الاقتصادي — رؤى',
    description: 'تقويم اقتصادي ذكي — أحداث مؤثرة، بيانات NFP و CPI و GDP، ومواعيد البنوك المركزية مع مؤثر رؤى المسبق.',
  },
};

export default function CalendarPage() {
  return <SmartCalendarCenter locale="ar" />;
}
