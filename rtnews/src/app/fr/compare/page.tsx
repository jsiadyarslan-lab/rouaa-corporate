import FrCompareClient from './FrCompareClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Comparaison d\'actifs',
  description: 'Comparez les indicateurs financiers et les actifs côte à côte avec des graphiques interactifs',
};

export default async function FrComparePage() {
  const availableIndicators = await db.marketIndicator.findMany({
    select: { id: true, name: true, nameAr: true, symbol: true, category: true, region: true },
    orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
  });

  return <FrCompareClient availableIndicators={availableIndicators} />;
}
