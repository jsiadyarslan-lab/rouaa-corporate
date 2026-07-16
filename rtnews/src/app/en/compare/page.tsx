import EnCompareClient from './EnCompareClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Asset Comparison',
  description: 'Compare financial indicators and assets side by side with interactive charts',
};

export default async function EnComparePage() {
  const availableIndicators = await db.marketIndicator.findMany({
    select: { id: true, name: true, nameAr: true, symbol: true, category: true, region: true },
    orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
  });

  return <EnCompareClient availableIndicators={availableIndicators} />;
}
