export const revalidate = 300;
import EnEconomicCalendarClient from '@/app/en/economic-calendar/EnEconomicCalendarClient';

export default function EsEconomicCalendarPage() {
  return <EnEconomicCalendarClient locale="es" />;
}
