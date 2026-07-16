export const revalidate = 300;
import { safeFindRisks } from '@/lib/geopolitical/safe-db';
import { TRADE_ROUTES } from '@/lib/geopolitical/trade-routes-data';
import TradeRoutesPageClient from '../../../geopolitical-risks/trade-routes/TradeRoutesPageClient';

export const metadata = { title: 'Routes Commerciales — Risques Géopolitiques — Rouaa', description: 'Suivi des routes commerciales mondiales' };

const safeParse = (str: string, fallback: any = []): any => { try { return JSON.parse(str); } catch { return fallback; } };

export default async function FrTradeRoutesPage() {
  let risks: any[] = [];
  try { risks = await safeFindRisks({ locale: 'fr', isPublished: true }, { orderBy: { publishedAt: 'desc' }, take: 20, select: { id: true, title: true, slug: true, riskScore: true, riskLevel: true, tradeRoutes: true, affectedAssets: true } }); } catch (e) { console.warn('[FrTradeRoutes] DB error:', e); }
  const serializedRisks = risks.map(r => ({ ...r, tradeRoutes: r.tradeRoutes ? (typeof r.tradeRoutes === 'string' ? safeParse(r.tradeRoutes, []) : r.tradeRoutes) : [], affectedAssets: r.affectedAssets ? (typeof r.affectedAssets === 'string' ? safeParse(r.affectedAssets, []) : r.affectedAssets) : [] }));
  return <TradeRoutesPageClient risks={serializedRisks} tradeRoutes={TRADE_ROUTES} locale="fr" />;
}
