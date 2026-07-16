export const revalidate = 300;
import { safeFindRisks } from '@/lib/geopolitical/safe-db';
import { getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import ScenariosPageClient from './ScenariosPageClient';

export const metadata = {
  title: 'محرك السيناريوهات — المخاطر الجيوسياسية — رؤى',
  description: 'استكشف السيناريوهات المحتملة للأزمات الجيوسياسية وتأثيرها المحتمل على الأسواق المالية',
};

const safeParse = (str: string, fallback: any = []): any => {
  try { return JSON.parse(str); } catch { return fallback; }
};

export default async function ScenariosPage() {
  let risks: any[] = [];

  try {
    risks = await safeFindRisks(
      { locale: 'ar', isPublished: true, scenarios: { not: null } },
      {
        orderBy: { publishedAt: 'desc' },
        take: 30,
        select: {
          id: true, title: true, slug: true, summary: true,
          riskCategory: true, riskLevel: true, riskScore: true,
          scenarios: true, affectedAssets: true, affectedRegions: true,
          imageUrl: true, publishedAt: true,
        },
      },
    );
  } catch (e) {
    console.warn('[GeoScenarios] DB fetch error:', e);
  }

  // Fallback to realtime API
  if (risks.length === 0) {
    try {
      const allRisks = await getRealtimeRisks('ar');
      // Only include risks that have scenarios
      risks = allRisks.filter(r => r.scenarios);
    } catch (e) {
      console.error('[GeoScenarios] Realtime fetch error:', e);
    }
  }

  const serializedRisks = risks.map(r => ({
    ...r,
    scenarios: r.scenarios ? (typeof r.scenarios === 'string' ? safeParse(r.scenarios, null) : r.scenarios) : null,
    affectedAssets: r.affectedAssets ? (typeof r.affectedAssets === 'string' ? safeParse(r.affectedAssets, []) : r.affectedAssets) : [],
    affectedRegions: r.affectedRegions ? (typeof r.affectedRegions === 'string' ? safeParse(r.affectedRegions, []) : r.affectedRegions) : [],
    publishedAt: r.publishedAt ? (typeof r.publishedAt === 'string' ? r.publishedAt : r.publishedAt.toISOString()) : null,
  }));

  return <ScenariosPageClient risks={serializedRisks} locale="ar" />;
}
