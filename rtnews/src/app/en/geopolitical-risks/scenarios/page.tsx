export const revalidate = 300;
import { safeFindRisks } from '@/lib/geopolitical/safe-db';
import { getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import ScenariosPageClient from '@/app/geopolitical-risks/scenarios/ScenariosPageClient';

export const metadata = {
  title: 'Scenario Engine — Geopolitical Risks — Rouaa',
  description: 'Explore potential scenarios for geopolitical crises and their possible impact on financial markets',
};

const safeParse = (str: string, fallback: any = []): any => {
  try { return JSON.parse(str); } catch { return fallback; }
};

export default async function EnScenariosPage() {
  let risks: any[] = [];
  try {
    risks = await safeFindRisks(
      { locale: 'en', isPublished: true, scenarios: { not: null } },
      { orderBy: { publishedAt: 'desc' }, take: 30, select: {
        id: true, title: true, slug: true, summary: true,
        riskCategory: true, riskLevel: true, riskScore: true,
        scenarios: true, affectedAssets: true, affectedRegions: true,
        imageUrl: true, publishedAt: true,
      }}
    );
  } catch (e) {
    console.warn('[EnGeoScenarios] DB fetch error:', e);
  }

  if (risks.length === 0) {
    try {
      const allRisks = await getRealtimeRisks('en');
      risks = allRisks.filter(r => r.scenarios);
    } catch (e) {
      console.error('[EnGeoScenarios] Realtime fetch error:', e);
    }
  }

  const serializedRisks = risks.map(r => ({
    ...r,
    scenarios: r.scenarios ? (typeof r.scenarios === 'string' ? safeParse(r.scenarios, null) : r.scenarios) : null,
    affectedAssets: r.affectedAssets ? (typeof r.affectedAssets === 'string' ? safeParse(r.affectedAssets, []) : r.affectedAssets) : [],
    affectedRegions: r.affectedRegions ? (typeof r.affectedRegions === 'string' ? safeParse(r.affectedRegions, []) : r.affectedRegions) : [],
    publishedAt: r.publishedAt ? (typeof r.publishedAt === 'string' ? r.publishedAt : r.publishedAt.toISOString()) : null,
  }));

  return <ScenariosPageClient risks={serializedRisks} locale="en" />;
}
