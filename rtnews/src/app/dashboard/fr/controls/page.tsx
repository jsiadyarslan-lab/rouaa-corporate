'use client';

import ProductionControls, { frLabels } from '@/components/dashboard/ProductionControls';

export default function FrControlsPage() {
  return <ProductionControls locale="fr" labels={frLabels} />;
}
