'use client';

import LanguageDashboard, { enDashboardLabels } from '@/components/dashboard/LanguageDashboard';

export default function EnDashboardPage() {
  return <LanguageDashboard locale="en" labels={enDashboardLabels} />;
}
