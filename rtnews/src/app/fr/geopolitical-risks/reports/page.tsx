export const revalidate = 300;
import { safeFindRisks } from '@/lib/geopolitical/safe-db';
import { getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import GeopoliticalReportsClient from '../../../geopolitical-risks/reports/GeopoliticalReportsClient';

export const metadata = { title: 'Rapports Risques Géopolitiques — Rouaa', description: 'Toutes les analyses et rapports sur les risques géopolitiques' };

const safeParse = (str: string, fallback: any = []): any => { try { return JSON.parse(str); } catch { return fallback; } };

export default async function FrGeopoliticalReportsPage() {
  let risks: any[] = [];
  try { risks = await safeFindRisks({ locale: 'fr', isPublished: true }, { orderBy: { publishedAt: 'desc' }, take: 60, select: { id: true, title: true, slug: true, summary: true, riskCategory: true, riskLevel: true, riskScore: true, affectedRegions: true, affectedCountries: true, affectedAssets: true, scenarios: true, imageUrl: true, publishedAt: true } }); } catch (e) { console.warn('[FrGeoReports] DB error:', e); }
  if (risks.length === 0) { try { risks = await getRealtimeRisks('fr'); } catch (e) { console.error('[FrGeoReports] Realtime error:', e); } }
  const serializedRisks = risks.map(r => ({ ...r, affectedRegions: r.affectedRegions ? (typeof r.affectedRegions === 'string' ? safeParse(r.affectedRegions, []) : r.affectedRegions) : [], affectedCountries: r.affectedCountries ? (typeof r.affectedCountries === 'string' ? safeParse(r.affectedCountries, []) : r.affectedCountries) : [], affectedAssets: r.affectedAssets ? (typeof r.affectedAssets === 'string' ? safeParse(r.affectedAssets, []) : r.affectedAssets) : [], scenarios: r.scenarios ? (typeof r.scenarios === 'string' ? safeParse(r.scenarios, null) : r.scenarios) : null, publishedAt: r.publishedAt ? (typeof r.publishedAt === 'string' ? r.publishedAt : r.publishedAt.toISOString()) : null }));
  return <GeopoliticalReportsClient risks={serializedRisks} locale="fr" />;
}
