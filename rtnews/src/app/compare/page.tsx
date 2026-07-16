import CompareClient from './CompareClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مقارنة الأصول',
  description: 'قارن بين المؤشرات والأصول المالية جنباً إلى جنب مع رسوم بيانية تفاعلية',
};

export default async function ComparePage() {
  const availableIndicators = await db.marketIndicator.findMany({
    select: { id: true, name: true, nameAr: true, symbol: true, category: true, region: true },
    orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
  });

  return <CompareClient availableIndicators={availableIndicators} />;
}
