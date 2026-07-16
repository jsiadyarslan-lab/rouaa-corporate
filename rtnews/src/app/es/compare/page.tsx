import EnCompareClient from '@/app/en/compare/EnCompareClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Comparación de Activos',
  description: 'Compare indicadores financieros y activos lado a lado con gráficos interactivos',
};

export default async function EsComparePage() {
  const availableIndicators = await db.marketIndicator.findMany({
    select: { id: true, name: true, nameAr: true, symbol: true, category: true, region: true },
    orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
  });

  return <EnCompareClient availableIndicators={availableIndicators} />;
}
