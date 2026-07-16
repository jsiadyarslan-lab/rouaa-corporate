import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import CategoryReportsPageClient from './CategoryReportsPageClient';

const REPORT_CATEGORIES = [
  { id: 'strategic', nameAr: 'تقارير استراتيجية', nameEn: 'Strategic Reports', icon: '🛡️', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)' },
  { id: 'economy', nameAr: 'اقتصاد كلي', nameEn: 'Macro Economy', icon: '🏛️', color: '#FF6B85', colorBg: 'rgba(239,83,80,.12)', colorBorder: 'rgba(239,83,80,.22)' },
  { id: 'forex', nameAr: 'عملات', nameEn: 'Currencies', icon: '💱', color: '#3BA7F0', colorBg: 'rgba(59,167,240,.14)', colorBorder: 'rgba(59,167,240,.3)' },
  { id: 'crypto', nameAr: 'كريبتو', nameEn: 'Crypto', icon: '₿', color: '#A78BFA', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)' },
  { id: 'energy', nameAr: 'طاقة', nameEn: 'Energy', icon: '⚡', color: '#E8824A', colorBg: 'rgba(232,130,74,.16)', colorBorder: 'rgba(232,130,74,.3)' },
  { id: 'commodities', nameAr: 'سلع', nameEn: 'Commodities', icon: '🥇', color: '#F0A500', colorBg: 'rgba(240,165,0,.18)', colorBorder: 'rgba(240,165,0,.35)' },
  { id: 'realEstate', nameAr: 'عقارات', nameEn: 'Real Estate', icon: '🏗️', color: '#4CC38A', colorBg: 'rgba(76,195,138,.14)', colorBorder: 'rgba(76,195,138,.3)' },
  { id: 'banking', nameAr: 'بنوك', nameEn: 'Banks', icon: '🏦', color: '#94A3B8', colorBg: 'rgba(100,116,139,.12)', colorBorder: 'rgba(100,116,139,.2)' },
  { id: 'stocks', nameAr: 'أسهم', nameEn: 'Stocks', icon: '📈', color: '#5B8DEF', colorBg: 'rgba(91,141,239,.14)', colorBorder: 'rgba(91,141,239,.3)' },
  { id: 'bonds', nameAr: 'سندات', nameEn: 'Bonds', icon: '📜', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.12)', colorBorder: 'rgba(139,92,246,.25)' },
  { id: 'technicalAnalysis', nameAr: 'تحليلات فنية', nameEn: 'Technical Analysis', icon: '📊', color: '#06B6D4', colorBg: 'rgba(6,182,212,.14)', colorBorder: 'rgba(6,182,212,.3)' },
  { id: 'arabMarkets', nameAr: 'أسواق عربية', nameEn: 'Arab Markets', icon: '🕌', color: '#00C9A7', colorBg: 'rgba(0,201,167,.12)', colorBorder: 'rgba(0,201,167,.25)' },
  { id: 'earnings', nameAr: 'أرباح الشركات', nameEn: 'Corporate Earnings', icon: '💰', color: '#FFB800', colorBg: 'rgba(255,184,0,.12)', colorBorder: 'rgba(255,184,0,.25)' },
];

const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

export const revalidate = 300;
interface Props {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const catDef = REPORT_CATEGORIES.find(c => c.id === categoryId);
  return {
    title: catDef ? `${catDef.nameAr} - مركز التقارير` : 'مركز التقارير',
  };
}

export function generateStaticParams() {
  return REPORT_CATEGORIES.map(cat => ({ categoryId: cat.id }));
}

export default async function CategoryReportsPage({ params }: Props) {
  const { categoryId } = await params;
  const catDef = REPORT_CATEGORIES.find(c => c.id === categoryId);

  if (!catDef) notFound();

  // Strategic reports are stored in EconomicReport with reportType='strategic'
  if (catDef.id === 'strategic') {
    const strategicReports = await db.economicReport.findMany({
      where: { isPublished: true, locale: 'ar', reportType: 'strategic' },
      orderBy: { publishedAt: 'desc' },
      take: 100,
      select: {
        id: true, title: true, slug: true,
        reportType: true, scope: true, marketImpact: true,
        confidenceScore: true, content: true, summary: true,
        publishedAt: true, createdAt: true,
      },
    });

    const formattedAnalyses = strategicReports.map(r => ({
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

    return <CategoryReportsPageClient category={catDef} initialAnalyses={formattedAnalyses} />;
  }

  const analyses = await db.marketAnalysis.findMany({
    where: { isPublished: true, locale: 'ar', assetClass: catDef.id },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    select: {
      id: true, title: true, slug: true, assetClass: true,
      analysisType: true, timeFrame: true, riskLevel: true,
      sentiment: true, confidenceScore: true, priceTarget: true,
      content: true, publishedAt: true, validUntil: true, createdAt: true,
    },
  });

  const formattedAnalyses = analyses.map(a => ({
    ...a,
    priceTarget: safeParse(a.priceTarget, {}),
    summary: (a.content && typeof a.content === 'string') ? a.content.slice(0, 200) + '...' : '',
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    validUntil: a.validUntil ? a.validUntil.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return <CategoryReportsPageClient category={catDef} initialAnalyses={formattedAnalyses} />;
}
