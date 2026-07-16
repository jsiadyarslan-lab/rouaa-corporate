import TrCompareClient from './TrCompareClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Varlık Karşılaştırma',
  description: 'Finansal göstergeleri ve varlıkları interaktif grafiklerle yan yana karşılaştırın',
};

export default async function TrComparePage() {
  const availableIndicators = await db.marketIndicator.findMany({
    select: { id: true, name: true, nameAr: true, symbol: true, category: true, region: true },
    orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
  });

  return <TrCompareClient availableIndicators={availableIndicators} />;
}
