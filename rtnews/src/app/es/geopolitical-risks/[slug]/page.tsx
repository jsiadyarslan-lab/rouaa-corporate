export const revalidate = 300;
// ─── Spanish Geopolitical Risk Detail Page ────────────────────────
// V1054: Uses shared GeopoliticalRiskDetailClient with locale="es"

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { safeFindRisk, safeFindRisks } from '@/lib/geopolitical/safe-db';
import { findRealtimeRiskBySlug, getRealtimeRelatedRisks } from '@/lib/geopolitical/realtime-data';
import { getRiskLevel } from '@/lib/geopolitical/risk-thresholds';
import GeopoliticalRiskDetailClient from '@/app/geopolitical-risks/[slug]/GeopoliticalRiskDetailClient';

const safeParse = (val: any, fallback: any = []): any => {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

const safeToISO = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  try { return new Date(val).toISOString(); } catch { return null; }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}
  if (!rawSlug || rawSlug === 'undefined') return { title: 'Riesgo no encontrado — Rouaa' };
  try {
    const slug = rawSlug;
    let risk = await safeFindRisk({ locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] });
    if (!risk) risk = await safeFindRisk({ isPublished: true, OR: [{ id: slug }, { slug }] });
    if (!risk) risk = await findRealtimeRiskBySlug(slug, 'es');
    if (!risk) return { title: 'Riesgo no encontrado — Rouaa' };
    return { title: `${risk.title} — Rouaa Riesgos Geopolíticos`, description: risk.summary?.slice(0, 160) || 'Análisis de riesgos geopolíticos e impacto en los mercados' };
  } catch { return { title: 'Rouaa Riesgos Geopolíticos' }; }
}

export default async function EsGeopoliticalRiskSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug: rawSlug } = await params;
  try { rawSlug = decodeURIComponent(rawSlug); } catch {}
  let slug = rawSlug;
  if (!slug || slug === 'undefined') notFound();

  let risk: any = await safeFindRisk({ locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] });
  if (!risk) risk = await safeFindRisk({ isPublished: true, OR: [{ id: slug }, { slug }] });
  if (!risk) { try { risk = await findRealtimeRiskBySlug(slug, 'es'); } catch {} }
  if (!risk) notFound();

  const serializedRisk = {
    ...risk,
    affectedRegions: safeParse(risk.affectedRegions, []),
    affectedCountries: safeParse(risk.affectedCountries, []),
    affectedAssets: safeParse(risk.affectedAssets, []),
    scenarios: risk.scenarios ? safeParse(risk.scenarios, null) : null,
    tradeRoutes: safeParse(risk.tradeRoutes, []),
    sourceUrls: safeParse(risk.sourceUrls, []),
    publishedAt: safeToISO(risk.publishedAt),
    createdAt: safeToISO(risk.createdAt) || new Date().toISOString(),
    updatedAt: safeToISO(risk.updatedAt) || new Date().toISOString(),
  };

  let related: any[] = [];
  try {
    related = await safeFindRisks(
      { locale: 'es', isPublished: true, id: { not: risk.id }, riskCategory: risk.riskCategory },
      { take: 4, orderBy: { publishedAt: 'desc' } },
    );
  } catch {}

  const serializedRelated = related.map(r => ({
    id: r.id, title: r.title, slug: r.slug, riskCategory: r.riskCategory,
    riskLevel: r.riskLevel, riskScore: r.riskScore, imageUrl: r.imageUrl,
    publishedAt: safeToISO(r.publishedAt),
  }));

  return <GeopoliticalRiskDetailClient risk={serializedRisk} related={serializedRelated} locale="es" />;
}
