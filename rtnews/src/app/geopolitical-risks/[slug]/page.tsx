export const revalidate = 300;
// ─── Geopolitical Risk Detail Page (Arabic) ────────────────────
// Renders a single geopolitical risk analysis with full details,
// affected markets, scenarios, and trade route impacts.
// Falls back to realtime API data (GDELT, World Bank, AI-GPR)
// when the database has no matching record.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { safeFindRisk, safeFindRisks } from '@/lib/geopolitical/safe-db';
import { findRealtimeRiskBySlug, getRealtimeRelatedRisks } from '@/lib/geopolitical/realtime-data';
import { getRiskLevel, getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';
import GeopoliticalRiskDetailClient from './GeopoliticalRiskDetailClient';


// Handles both JSON strings (from DB) and already-parsed objects (from realtime)
const safeParse = (val: any, fallback: any = []): any => {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

// Handles both Date objects (from DB) and ISO strings (from realtime)
const safeToISO = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  try { return new Date(val).toISOString(); } catch { return null; }
};

// ─── Generate Dynamic Metadata for SEO ────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}

  if (!rawSlug || rawSlug === 'undefined') return { title: 'التحليل غير موجود — رؤى' };

  try {
    const slug = rawSlug;
    let risk = await safeFindRisk({ locale: 'ar', isPublished: true, OR: [{ id: slug }, { slug }] });

    if (!risk) {
      try {
        const decoded = decodeURIComponent(slug);
        if (decoded !== slug) {
          risk = await safeFindRisk({ locale: 'ar', isPublished: true, OR: [{ id: decoded }, { slug: decoded }] });
        }
      } catch {}
    }

    if (!risk) {
      risk = await safeFindRisk({ isPublished: true, OR: [{ id: slug }, { slug }] });
    }

    // Realtime fallback for metadata
    if (!risk) {
      risk = await findRealtimeRiskBySlug(slug, 'ar');
    }

    if (!risk) return { title: 'التحليل غير موجود — رؤى' };

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try { const hdrs = await headers(); const host = hdrs.get('host'); const proto = hdrs.get('x-forwarded-proto') || 'https'; if (host) baseUrl = `${proto}://${host}`; } catch {}

    return {
      title: `${risk.title} — رؤى المخاطر الجيوسياسية`,
      description: risk.summary ? risk.summary.slice(0, 160) : 'تحليل المخاطر الجيوسياسية وتأثيرها على الأسواق',
      openGraph: {
        title: risk.title,
        url: `${baseUrl}/geopolitical-risks/${risk.slug || slug}`,
        siteName: 'رؤى',
        locale: 'ar_AR',
        type: 'article',
        images: risk.imageUrl ? [{ url: risk.imageUrl }] : undefined,
      },
    };
  } catch {
    return { title: 'رؤى المخاطر الجيوسياسية' };
  }
}

// ─── Page Component ──────────────────────────────────────────
export default async function GeopoliticalRiskSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug: rawSlug } = await params;
  try { const decodedOnce = decodeURIComponent(rawSlug); rawSlug = decodedOnce; } catch {}
  let slug = rawSlug;

  if (!slug || slug === 'undefined') notFound();

  // Strategy 1: Find risk with locale=ar and slug/id
  let risk = await safeFindRisk({ locale: 'ar', isPublished: true, OR: [{ id: slug }, { slug }] });

  // Strategy 2: Try different locale
  if (!risk) {
    risk = await safeFindRisk({ isPublished: true, OR: [{ id: slug }, { slug }] });
  }

  // Strategy 3: Try URL-decoded slug
  if (!risk && slug !== rawSlug) {
    risk = await safeFindRisk({ isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] });
  }

  // Strategy 4: Arabic character normalization
  if (!risk) {
    const normalizeArabic = (s: string): string =>
      s.replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/[يى]/g, 'ى');
    const normalizedSlug = normalizeArabic(slug);
    if (normalizedSlug !== slug) {
      risk = await safeFindRisk({ locale: 'ar', isPublished: true, slug: { contains: normalizedSlug.slice(0, 20) } });
      if (risk && normalizeArabic(risk.slug || '') !== normalizedSlug) risk = null;
    }
  }

  // Strategy 5: Slug suffix match
  if (!risk) {
    const parts = slug.split('-');
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      risk = await safeFindRisk({ locale: 'ar', isPublished: true, slug: { endsWith: `-${slugSuffix}` } });
    }
  }

  // Strategy 6: Realtime API fallback (GDELT, World Bank, AI-GPR)
  let usingRealtimeData = false;
  if (!risk) {
    try {
      const rtRisk = await findRealtimeRiskBySlug(slug, 'ar');
      if (rtRisk) {
        risk = rtRisk;
        usingRealtimeData = true;
      }
    } catch (e) {
      console.warn('[GeoRiskSlug] Realtime fallback failed:', e);
    }
  }

  if (!risk) notFound();

  // Serialize for client — handles both DB data and realtime data
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

  // Related risks
  let related: any[] = await safeFindRisks(
    {
      locale: 'ar',
      isPublished: true,
      id: { not: risk.id },
      riskCategory: risk.riskCategory,
    },
    { take: 4, orderBy: { publishedAt: 'desc' } },
  ).catch(() => []);

  // If DB returned no related, try realtime
  if (related.length === 0 && usingRealtimeData) {
    try {
      const rtRelated = await getRealtimeRelatedRisks(risk.riskCategory, risk.id, 'ar', 4);
      related = rtRelated.map(r => ({ ...r, riskLevel: getRiskLevel(r.riskScore) }));
    } catch {}
  }

  const serializedRelated = related.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    riskCategory: r.riskCategory,
    riskLevel: r.riskLevel,
    riskScore: r.riskScore,
    imageUrl: r.imageUrl,
    publishedAt: safeToISO(r.publishedAt),
  }));

  return <GeopoliticalRiskDetailClient risk={serializedRisk} related={serializedRelated} />;
}
