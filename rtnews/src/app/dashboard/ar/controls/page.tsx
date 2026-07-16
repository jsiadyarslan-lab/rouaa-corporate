'use client';

import ProductionControls, { arLabels } from '@/components/dashboard/ProductionControls';

export default function ArControlsPage() {
  return <ProductionControls locale="ar" labels={arLabels} />;
}
