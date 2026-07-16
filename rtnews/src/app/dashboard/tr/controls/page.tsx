'use client';

import ProductionControls, { trLabels } from '@/components/dashboard/ProductionControls';

export default function TrControlsPage() {
  return <ProductionControls locale="tr" labels={trLabels} />;
}
