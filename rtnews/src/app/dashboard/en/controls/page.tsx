'use client';

import ProductionControls, { enLabels } from '@/components/dashboard/ProductionControls';

export default function EnControlsPage() {
  return <ProductionControls locale="en" labels={enLabels} />;
}
