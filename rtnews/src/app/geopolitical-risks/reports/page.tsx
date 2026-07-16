export const revalidate = 300;
import { safeFindRisks } from '@/lib/geopolitical/safe-db';
import { getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import GeopoliticalReportsClient from './GeopoliticalReportsClient';

export const metadata = {
  title: 'تقارير المخاطر الجيوسياسية — رؤى',
  description: 'جميع تحليلات وتقارير المخاطر الجيوسياسية مع إمكانية البحث والتصفية حسب الفئة ومستوى الخطر',
};

const safeParse = (str: string, fallback: any = []): any => {
  try { return JSON.parse(str); } catch { return fallback; }
};

export default async function GeopoliticalReportsPage() {
  let risks: any[] = [];

  try {
    risks = await safeFindRisks(
      { locale: 'ar', isPublished: true },
      {
        orderBy: { publishedAt: 'desc' },
        take: 60,
        select: {
          id: true, title: true, slug: true, summary: true,
          riskCategory: true, riskLevel: true, riskScore: true,
          affectedRegions: true, affectedCountries: true, affectedAssets: true,
          scenarios: true, imageUrl: true, publishedAt: true,
        },
      },
    );
  } catch (e) {
    console.warn('[GeoReports] DB fetch error:', e);
  }

  // Fallback to realtime API
  if (risks.length === 0) {
    try {
      risks = await getRealtimeRisks('ar');
    } catch (e) {
      console.error('[GeoReports] Realtime fetch error:', e);
    }
  }

  const serializedRisks = risks.map(r => ({
    ...r,
    affectedRegions: r.affectedRegions ? (typeof r.affectedRegions === 'string' ? safeParse(r.affectedRegions, []) : r.affectedRegions) : [],
    affectedCountries: r.affectedCountries ? (typeof r.affectedCountries === 'string' ? safeParse(r.affectedCountries, []) : r.affectedCountries) : [],
    affectedAssets: r.affectedAssets ? (typeof r.affectedAssets === 'string' ? safeParse(r.affectedAssets, []) : r.affectedAssets) : [],
    scenarios: r.scenarios ? (typeof r.scenarios === 'string' ? safeParse(r.scenarios, null) : r.scenarios) : null,
    publishedAt: r.publishedAt ? (typeof r.publishedAt === 'string' ? r.publishedAt : r.publishedAt.toISOString()) : null,
  }));

  return <GeopoliticalReportsClient risks={serializedRisks} locale="ar" />;
}
