import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import TgReportClient from './TgReportClient';

export const revalidate = 300;
interface ReportData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  reportType: string;
  scope: string;
  sectors: string[];
  countries: string[];
  keyIndicators: Record<string, any>;
  marketImpact: string;
  confidenceScore: number;
  sourceUrls: string[];
  imageUrl: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
}

const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

export default async function TgReportPage({ params }: { params: Promise<{ slug: string }> }) {
  let slug = '';
  try {
    const { slug: rawSlug } = await params;

    slug = rawSlug;
    try {
      const decoded = decodeURIComponent(rawSlug);
      if (decoded !== rawSlug) slug = decoded;
    } catch {}

  // Try finding report by id or slug
  const dbReport = await db.economicReport.findFirst({
    where: { isPublished: true, OR: [{ id: slug }, { slug }] },
  });

  let report: ReportData | null = null;

  if (dbReport) {
    const sectors = Array.isArray(dbReport.sectors)
      ? dbReport.sectors
      : safeParse(dbReport.sectors as string, []);

    const countries = Array.isArray(dbReport.countries)
      ? dbReport.countries
      : safeParse(dbReport.countries as string, []);

    const keyIndicators = typeof dbReport.keyIndicators === 'object' && dbReport.keyIndicators !== null
      ? dbReport.keyIndicators as Record<string, any>
      : safeParse(dbReport.keyIndicators as string, {});

    const sourceUrls = Array.isArray(dbReport.sourceUrls)
      ? dbReport.sourceUrls
      : safeParse(dbReport.sourceUrls as string, []);

    report = {
      id: dbReport.id,
      title: dbReport.title,
      slug: dbReport.slug,
      summary: dbReport.summary || '',
      content: dbReport.content || '',
      reportType: dbReport.reportType || 'daily',
      scope: dbReport.scope || 'global',
      sectors: sectors as string[],
      countries: countries as string[],
      keyIndicators,
      marketImpact: dbReport.marketImpact || 'neutral',
      confidenceScore: dbReport.confidenceScore || 50,
      sourceUrls: sourceUrls as string[],
      imageUrl: dbReport.imageUrl || null,
      publishedAt: dbReport.publishedAt,
      createdAt: dbReport.createdAt,
    };
  }

  // Try MarketAnalysis
  if (!report) {
    const analysis = await db.marketAnalysis.findFirst({
      where: { isPublished: true, OR: [{ id: slug }, { slug }] },
    });

    if (analysis) {
      let summary = '';
      try {
        const parsed = JSON.parse(analysis.content || '{}');
        const sections = parsed.sections || {};
        summary = sections.introduction || sections.overview || sections.executiveSummary || '';
      } catch {}

      report = {
        id: analysis.id,
        title: analysis.title,
        slug: analysis.slug,
        summary,
        content: analysis.content || '',
        reportType: 'analysis',
        scope: analysis.assetClass || 'economy',
        sectors: [],
        countries: [],
        keyIndicators: {},
        marketImpact: analysis.sentiment || 'neutral',
        confidenceScore: analysis.confidenceScore || 50,
        sourceUrls: [],
        imageUrl: null,
        publishedAt: analysis.publishedAt || analysis.createdAt,
        createdAt: analysis.createdAt,
      };
    }
  }

  if (!report) return notFound();

  return <TgReportClient report={report} />;
  } catch (err) {
    if (err instanceof Error && (err as any).digest === 'NEXT_NOT_FOUND') throw err;
    if (err instanceof Error && err.message?.includes('NEXT_NOT_FOUND')) throw err;
    if (err instanceof Error && (err as any).digest?.startsWith('NEXT_')) throw err;
    console.error('════════════════════════════════════════');
    console.error(`🚨 [TG REPORT PAGE] Failed to load report slug="${slug}"`);
    console.error('Error:', err);
    console.error('════════════════════════════════════════');
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0A0E27', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '480px', padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Report Load Error</h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px' }}>slug: {slug}</p>
          <a href="/" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: '#00E5FF', color: '#0A0E27', textDecoration: 'none', fontWeight: 600 }}>Home</a>
        </div>
      </div>
    );
  }
}
