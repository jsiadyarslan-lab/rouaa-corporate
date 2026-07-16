// ─── Turkish Reports Listing Page ────────────────────────────
// Server Component — fetches Turkish reports from DB grouped by category
// Mirrors the French reports page structure with LTR direction and Turkish content

import { Metadata } from 'next';
import { db } from '@/lib/db';
import { formatTimeAgoLocale } from '@/lib/locale';
import TrReportsPageClient from './TrReportsPageClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Raporlar & Analizler — Rouaa',
  description: 'Yapay zeka destekli, tüm sektörleri ve varlık sınıflarını kapsayan kapsamlı ekonomik raporlar ve piyasa analizleri',
  openGraph: {
    title: 'Rouaa — Raporlar & Analizler',
    description: 'Yapay zeka destekli, tüm sektörleri ve varlık sınıflarını kapsayan kapsamlı ekonomik raporlar ve piyasa analizleri',
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

// Turkish AI apology patterns to filter out
const TR_APOLOGY_PATTERNS = [/Özür dilerim/i, /Yapay zeka olarak/i, /Ben bir yapay zeka/i, /Yapamam/i];

export default async function TrReportsPage() {
  const categories = ['economy', 'forex', 'crypto', 'energy', 'commodities', 'stocks', 'bonds', 'technicalAnalysis', 'earnings'];

  // Fetch Turkish MarketAnalyses grouped by asset class category
  let marketCategoryData: { category: string; analizs: any[] }[] = [];
  try {
    marketCategoryData = await Promise.all(
      categories.map(async (cat) => {
        const analyses = await db.marketAnalysis.findMany({
          where: { isPublished: true, locale: 'tr', assetClass: cat },
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
        const filteredAnalyses = analyses.filter((a: any) => !TR_APOLOGY_PATTERNS.some(p => p.test(a.title)));

        return {
          category: cat,
          analizs: filteredAnalyses.map((a: any) => ({
            ...a,
            priceTarget: safeParse(a.priceTarget, {}),
            publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
            validUntil: a.validUntil ? a.validUntil.toISOString() : null,
            createdAt: a.createdAt.toISOString(),
          })),
        };
      })
    );
  } catch (err: any) {
    console.error('[TrReportsPage] Error fetching market analyses:', err.message);
    marketCategoryData = categories.map(cat => ({ category: cat, analizs: [] }));
  }

  const categoryData = marketCategoryData;

  // Fetch Turkish EconomicReports by type
  const reportSelect = {
    id: true, title: true, slug: true, summary: true,
    reportType: true, scope: true, marketImpact: true,
    confidenceScore: true, imageUrl: true,
    sectors: true, countries: true,
    publishedAt: true, createdAt: true,
  } as const;

  let daily: any[] = [], weekly: any[] = [], monthly: any[] = [], quarterly: any[] = [], special: any[] = [], strategic: any[] = [];
  try {
    [daily, weekly, monthly, quarterly, special, strategic] = await Promise.all([
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'tr', reportType: 'daily' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: reportSelect,
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'tr', reportType: 'weekly' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: reportSelect,
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'tr', reportType: 'monthly' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: reportSelect,
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'tr', reportType: 'quarterly' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: reportSelect,
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'tr', reportType: 'special' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: reportSelect,
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'tr', reportType: 'strategic' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: reportSelect,
      }),
    ]);
  } catch (err: any) {
    console.error('[TrReportsPage] Error fetching economic reports:', err.message);
  }

  const parseReport = (r: any) => ({
    ...r,
    sectors: safeParse(r.sectors, []),
    countries: safeParse(r.countries, []),
    summary: cleanReportSummary(r.summary || ''),
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  });

  return (
    <TrReportsPageClient
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
