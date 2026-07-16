import SmartCalendarCenter from '@/components/calendar/SmartCalendarCenter';

// CRITICAL: force-dynamic prevents ISR caching — see /calendar/page.tsx for rationale.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TrCalendarPage() {
  return <SmartCalendarCenter locale="tr" />;
}
