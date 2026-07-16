'use client';

import LanguageDashboard, { arDashboardLabels } from '@/components/dashboard/LanguageDashboard';

export default function ArDashboardPage() {
  return <LanguageDashboard locale="ar" labels={arDashboardLabels} />;
}
