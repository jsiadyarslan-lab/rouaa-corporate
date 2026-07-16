'use client';

import LanguageDashboard, { frDashboardLabels } from '@/components/dashboard/LanguageDashboard';

export default function FrDashboardPage() {
  return <LanguageDashboard locale="fr" labels={frDashboardLabels} />;
}
