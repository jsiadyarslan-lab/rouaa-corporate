// ─── English Category Reports Detail Page ────────────────────
// Server Component — fetches English reports for a specific category
// Mirrors the Arabic category page with LTR direction and English content

import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import EnCategoryReportsPageClient from './EnCategoryReportsPageClient';

const EN_REPORT_CATEGORIES = [
  { id: 'strategic', nameEn: 'Strategic Reports', icon: '🛡️', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)' },
  { id: 'economy', nameEn: 'Macro Economy', icon: '🏛️', color: '#FF6B85', colorBg: 'rgba(239,83,80,.12)', colorBorder: 'rgba(239,83,80,.22)' },
  { id: 'forex', nameEn: 'Currencies', icon: '💱', color: '#3BA7F0', colorBg: 'rgba(59,167,240,.14)', colorBorder: 'rgba(59,167,240,.3)' },
  { id: 'crypto', nameEn: 'Crypto', icon: '₿', color: '#A78BFA', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)' },
  { id: 'energy', nameEn: 'Energy', icon: '⚡', color: '#E8824A', colorBg: 'rgba(232,130,74,.16)', colorBorder: 'rgba(232,130,74,.3)' },
  { id: 'commodities', nameEn: 'Commodities', icon: '🥇', color: '#F0A500', colorBg: 'rgba(240,165,0,.18)', colorBorder: 'rgba(240,165,0,.35)' },
  { id: 'stocks', nameEn: 'Stocks', icon: '📈', color: '#5B8DEF', colorBg: 'rgba(91,141,239,.14)', colorBorder: 'rgba(91,141,239,.3)' },
  { id: 'bonds', nameEn: 'Bonds', icon: '📜', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.12)', colorBorder: 'rgba(139,92,246,.25)' },
  { id: 'technicalAnalysis', nameEn: 'Technical Analysis', icon: '📊', color: '#06B6D4', colorBg: 'rgba(6,182,212,.14)', colorBorder: 'rgba(6,182,212,.3)' },
  { id: 'earnings', nameEn: 'Corporate Earnings', icon: '💰', color: '#FFB800', colorBg: 'rgba(255,184,0,.12)', colorBorder: 'rgba(255,184,0,.25)' },
];

const safeParse = (str: string, fallback: any = []) => {
  try { return JSON.parse(str); } catch { return fallback; }
};

// English AI apology patterns to filter out
const EN_APOLOGY_PATTERNS = [/I apologize/i, /I cannot/i, /I'm sorry/i, /I am sorry/i, /As an AI/i, /I am not able/i];

export const revalidate = 300;
interface Props {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const catDef = EN_REPORT_CATEGORIES.find(c => c.id === categoryId);
  return {
    title: catDef ? `${catDef.nameEn} — Reports Center` : 'Reports Center — Rouaa',
    description: catDef
      ? `Browse ${catDef.nameEn} reports and analysis powered by AI`
      : 'Comprehensive AI-powered economic reports and market analysis',
  };
}

export function generateStaticParams() {
  return EN_REPORT_CATEGORIES.map(cat => ({ categoryId: cat.id }));
}

export default async function EnCategoryReportsPage({ params }: Props) {
  const { categoryId } = await params;
  const catDef = EN_REPORT_CATEGORIES.find(c => c.id === categoryId);

  if (!catDef) notFound();

  // Strategic reports are stored in EconomicReport with reportType='strategic'
  if (catDef.id === 'strategic') {
    const strategicReports = await db.economicReport.findMany({
      where: { isPublished: true, locale: 'en', reportType: 'strategic' },
      orderBy: { publishedAt: 'desc' },
      take: 100,
      select: {
        id: true, title: true, slug: true,
        reportType: true, scope: true, marketImpact: true,
        confidenceScore: true, content: true, summary: true,
        publishedAt: true, createdAt: true,
      },
    });

    // Filter out AI apology titles
    const filteredReports = strategicReports.filter(r => !EN_APOLOGY_PATTERNS.some(p => p.test(r.title)));

    const formattedAnalyses = filteredReports.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      assetClass: 'strategic',
      analysisType: 'strategic',
      timeFrame: 'long',
      riskLevel: 'medium',
      sentiment: r.marketImpact === 'bullish' ? 'bullish' : r.marketImpact === 'bearish' ? 'bearish' : 'neutral',
      confidenceScore: r.confidenceScore,
      priceTarget: {},
      summary: r.summary || (r.content && typeof r.content === 'string' ? r.content.slice(0, 200) + '...' : ''),
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      validUntil: null,
      createdAt: r.createdAt.toISOString(),
    }));

    return <EnCategoryReportsPageClient category={catDef} initialAnalyses={formattedAnalyses} />;
  }

  const analyses = await db.marketAnalysis.findMany({
    where: { isPublished: true, locale: 'en', assetClass: catDef.id },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    select: {
      id: true, title: true, slug: true, assetClass: true,
      analysisType: true, timeFrame: true, riskLevel: true,
      sentiment: true, confidenceScore: true, priceTarget: true,
      content: true, publishedAt: true, validUntil: true, createdAt: true,
    },
  });

  // Filter out AI apology titles
  const filteredAnalyses = analyses.filter(a => !EN_APOLOGY_PATTERNS.some(p => p.test(a.title)));

  const formattedAnalyses = filteredAnalyses.map(a => ({
    ...a,
    priceTarget: safeParse(a.priceTarget, {}),
    summary: (a.content && typeof a.content === 'string') ? a.content.slice(0, 200) + '...' : '',
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    validUntil: a.validUntil ? a.validUntil.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return <EnCategoryReportsPageClient category={catDef} initialAnalyses={formattedAnalyses} />;
}
