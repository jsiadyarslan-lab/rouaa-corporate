'use client';

import LanguageDashboard, { trDashboardLabels } from '@/components/dashboard/LanguageDashboard';

export default function TrDashboardPage() {
  return <LanguageDashboard locale="tr" labels={trDashboardLabels} />;
}
