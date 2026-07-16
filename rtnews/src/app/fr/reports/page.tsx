// ─── French Reports Listing Page ────────────────────────────
// Server Component — fetches French reports from DB grouped by category
// Mirrors the English reports page structure with LTR direction and French content

import { Metadata } from 'next';
import { db } from '@/lib/db';
import { formatTimeAgoLocale } from '@/lib/locale';
import FrReportsPageClient from './FrReportsPageClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Rapports & Analyses — Rouaa',
  description: 'Rapports économiques et analyses de marché complets propulsés par l\'IA, couvrant tous les secteurs et classes d\'actifs',
  openGraph: {
    title: 'Rouaa — Rapports & Analyses',
    description: 'Rapports économiques et analyses de marché complets propulsés par l\'IA, couvrant tous les secteurs et classes d\'actifs',
  },
};

const safeParse = (str: string, fallback: any = []) => {
  try { return JSON.parse(str); } catch { return fallback; }
};

// Clean JSON code blocks from report summaries
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
    } catch { /* not JSON */ }
  }
  return cleaned.slice(0, 300);
}

// French AI apology patterns to filter out
const FR_APOLOGY_PATTERNS = [/Je m'excuse/i, /Je ne peux pas/i, /Je suis désolé/i, /En tant qu'IA/i, /Je ne suis pas en mesure/i];

export default async function FrReportsPage() {
  const categories = ['economy', 'forex', 'crypto', 'energy', 'commodities', 'stocks', 'bonds', 'technicalAnalysis', 'earnings'];

  // Fetch French MarketAnalyses grouped by asset class category
  const marketCategoryData = await Promise.all(
    categories.map(async (cat) => {
      const analyses = await db.marketAnalysis.findMany({
        where: { isPublished: true, locale: 'fr', assetClass: cat },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: {
          id: true, title: true, slug: true, assetClass: true,
          analysisType: true, timeFrame: true, riskLevel: true,
          sentiment: true, confidenceScore: true, priceTarget: true,
          publishedAt: true, validUntil: true, createdAt: true,
        },
      });

      // Filter out AI apology titles
      const filteredAnalyses = analyses.filter((a: any) => !FR_APOLOGY_PATTERNS.some(p => p.test(a.title)));

      return {
        category: cat,
        analyses: filteredAnalyses.map((a: any) => ({
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

  // Fetch French EconomicReports by type
  const reportSelect = {
    id: true, title: true, slug: true, summary: true,
    reportType: true, scope: true, marketImpact: true,
    confidenceScore: true, imageUrl: true,
    sectors: true, countries: true,
    publishedAt: true, createdAt: true,
  } as const;

  const [daily, weekly, monthly, quarterly, special, strategic] = await Promise.all([
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr', reportType: 'daily' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: reportSelect,
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr', reportType: 'weekly' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: reportSelect,
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr', reportType: 'monthly' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: reportSelect,
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr', reportType: 'quarterly' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: reportSelect,
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr', reportType: 'special' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: reportSelect,
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr', reportType: 'strategic' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: reportSelect,
    }),
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
    <FrReportsPageClient
      initialCategoryData={categoryData}
      initialDaily={daily.map(parseReport)}
      initialWeekly={weekly.map(parseReport)}
      initialMonthly={monthly.map(parseReport)}
      initialQuarterly={quarterly.map(parseReport)}
      initialSpecial={special.map(parseReport)}
      initialStrategic={strategic.map(parseReport)}
    />
  );
}
