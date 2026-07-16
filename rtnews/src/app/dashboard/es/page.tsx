'use client';

import LanguageDashboard, { esDashboardLabels } from '@/components/dashboard/LanguageDashboard';

export default function EsDashboardPage() {
  return <LanguageDashboard locale="es" labels={esDashboardLabels} />;
}
