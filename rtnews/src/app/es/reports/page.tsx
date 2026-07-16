import { Metadata } from 'next';
import { db } from '@/lib/db';
import { formatTimeAgoLocale } from '@/lib/locale';
import EsReportsPageClient from './EsReportsPageClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Informes y Análisis — Rouaa',
  description: 'Informes económicos integrales potenciados por IA y análisis de mercado que cubren todos los sectores y clases de activos',
  openGraph: {
    title: 'Rouaa — Informes y Análisis',
    description: 'Informes económicos integrales potenciados por IA y análisis de mercado',
  },
};

const safeParse = (str: string, fallback: any = []) => {
  try { return JSON.parse(str); } catch { return fallback; }
};

function cleanReportSummary(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/```(?:json)?\s*/gi, '');
  if (cleaned.trim().startsWith('{') || cleaned.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(cleaned.trim());
      if (typeof parsed === 'object' && parsed !== null) {
        const extractText = (obj: any, depth = 0): string[] => {
          if (depth > 4) return [];
          const parts: string[] = [];
          if (typeof obj === 'string') {
            if (obj.length > 10) parts.push(obj);
          } else if (Array.isArray(obj)) {
            for (const item of obj) parts.push(...extractText(item, depth + 1));
          } else if (typeof obj === 'object' && obj !== null) {
            if (obj.sections && typeof obj.sections === 'object') {
              for (const val of Object.values(obj.sections as Record<string, unknown>)) {
                parts.push(...extractText(val, depth + 1));
              }
            } else if (obj.introduction || obj.summary || obj.overview || obj.executiveSummary) {
              for (const key of ['introduction', 'summary', 'overview', 'executiveSummary']) {
                if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 10) {
                  parts.push(obj[key]);
                }
              }
            } else {
              for (const val of Object.values(obj)) {
                if (typeof val === 'string' && val.length > 10) parts.push(val);
                else if (typeof val === 'object' && val !== null) parts.push(...extractText(val, depth + 1));
              }
            }
          }
          return parts;
        };
        const textParts = extractText(parsed);
        if (textParts.length > 0) return textParts.slice(0, 2).join(' ');
      }
    } catch {}
  }
  return cleaned.slice(0, 300);
}

const EN_APOLOGY_PATTERNS = [/I apologize/i, /I cannot/i, /I'm sorry/i, /I am sorry/i, /As an AI/i, /I am not able/i];

export default async function EsReportsPage() {
  const categories = ['economy', 'forex', 'crypto', 'energy', 'commodities', 'stocks', 'bonds', 'technicalAnalysis', 'earnings'];

  const marketCategoryData = await Promise.all(
    categories.map(async (cat) => {
      const analyses = await db.marketAnalysis.findMany({
        where: { isPublished: true, locale: 'es', assetClass: cat },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: {
          id: true, title: true, slug: true, assetClass: true,
          analysisType: true, timeFrame: true, riskLevel: true,
          sentiment: true, confidenceScore: true, priceTarget: true,
          publishedAt: true, validUntil: true, createdAt: true,
        },
      });

      const filteredAnalyses = analyses.filter(a => !EN_APOLOGY_PATTERNS.some(p => p.test(a.title)));

      return {
        category: cat,
        analyses: filteredAnalyses.map(a => ({
          ...a,
          priceTarget: safeParse(a.priceTarget, {}),
          publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
          validUntil: a.validUntil ? a.validUntil.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    })
  );

  const categoryData = marketCategoryData;

  const reportSelect = {
    id: true, title: true, slug: true, summary: true,
    reportType: true, scope: true, marketImpact: true,
    confidenceScore: true, imageUrl: true,
    sectors: true, countries: true,
    publishedAt: true, createdAt: true,
  } as const;

  const [daily, weekly, monthly, quarterly, special, strategic] = await Promise.all([
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es', reportType: 'daily' }, orderBy: { publishedAt: 'desc' }, take: 6, select: reportSelect }),
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es', reportType: 'weekly' }, orderBy: { publishedAt: 'desc' }, take: 6, select: reportSelect }),
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es', reportType: 'monthly' }, orderBy: { publishedAt: 'desc' }, take: 6, select: reportSelect }),
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es', reportType: 'quarterly' }, orderBy: { publishedAt: 'desc' }, take: 6, select: reportSelect }),
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es', reportType: 'special' }, orderBy: { publishedAt: 'desc' }, take: 6, select: reportSelect }),
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es', reportType: 'strategic' }, orderBy: { publishedAt: 'desc' }, take: 6, select: reportSelect }),
  ]);

  const parseReport = (r: any) => ({
    ...r,
    sectors: safeParse(r.sectors, []),
    countries: safeParse(r.countries, []),
    summary: cleanReportSummary(r.summary || ''),
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  });

  return (
    <EsReportsPageClient
      initialCategoryData={categoryData}
      initialDaily={daily.map(parseReport)}
      initialWeekly={weekly.map(parseReport)}
      initialMonthly={monthly.map(parseReport)}
      initialQuarterly={quarterly.map(parseReport)}
      initialSpecial={special.map(parseReport)}
      initialStrategic={strategic.map(parseReport)}
      locale="es"
    />
  );
}
