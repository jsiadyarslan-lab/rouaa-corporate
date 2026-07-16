// ─── French Strategic Report Detail Page ─────────────────────
// Renders the strategic report content directly (no redirect to /fr/reports/).
// This keeps the user on the strategic reports URL.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { stripMarkdownHeadings, stripSummaryMarkdown, truncateAtBoundary } from '@/lib/clean-markdown';
import FrReportDetailClient from '@/app/en/reports/[slug]/EnReportDetailClient';

export const revalidate = 300;
const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

function processContent(rawContent: string): {
  sections: Record<string, string>;
  metadata: Record<string, any>;
  dataQuality: Record<string, any>;
  summary: string;
} {
  const result = { sections: {} as Record<string, string>, metadata: {} as Record<string, any>, dataQuality: {} as Record<string, any>, summary: '' };
  if (!rawContent || rawContent.trim().length === 0) return result;

  try {
    const parsed = JSON.parse(rawContent);
    if (parsed.sections && typeof parsed.sections === 'object') {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (typeof value === 'string' && value.trim().length > 0) result.sections[key] = stripMarkdownHeadings(value);
        else if (typeof value === 'object' && value !== null) {
          const extractText = (obj: any, d = 0): string => {
            if (d > 3) return '';
            const parts: string[] = [];
            for (const [k, v] of Object.entries(obj)) {
              if (typeof v === 'string' && v.trim().length > 5) parts.push(v.trim());
              else if (Array.isArray(v)) for (const i of v) { if (typeof i === 'string' && i.trim().length > 5) parts.push(`- ${i.trim()}`); }
              else if (typeof v === 'object' && v !== null) { const n = extractText(v, d + 1); if (n) parts.push(n); }
            }
            return parts.join('\n\n');
          };
          const extracted = extractText(value);
          if (extracted.length > 20) result.sections[key] = stripMarkdownHeadings(extracted);
        }
      }
    }
    result.metadata = parsed.metadata || {};
    result.dataQuality = parsed.dataQuality || {};
    const rawSummary = result.sections.introduction || result.sections.overview || result.sections.executiveSummary || result.sections.context || '';
    result.summary = stripSummaryMarkdown(rawSummary);
    if (result.summary.length > 500) result.summary = truncateAtBoundary(result.summary, 500);
  } catch {
    const text = rawContent.trim();
    if (text.length > 20) {
      result.sections.overview = stripMarkdownHeadings(text);
      result.summary = stripSummaryMarkdown(text.slice(0, 500));
    }
  }
  return result;
}

// ─── Generate Dynamic Metadata for SEO ────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}

  if (!rawSlug || rawSlug === 'undefined') return { title: 'Rapport introuvable — Rouaa' };

  try {
    const slug = rawSlug;
    let report = await db.economicReport.findFirst({
      where: { locale: 'fr', isPublished: true, reportType: 'strategic', OR: [{ id: slug }, { slug }] },
      select: { id: true, title: true, summary: true, slug: true, confidenceScore: true, imageUrl: true },
    });
    if (!report) {
      report = await db.economicReport.findFirst({
        where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
        select: { id: true, title: true, summary: true, slug: true, confidenceScore: true, imageUrl: true },
      });
    }
    if (!report) return { title: 'Rapport introuvable — Rouaa' };

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try { const hdrs = await headers(); const host = hdrs.get('host'); const proto = hdrs.get('x-forwarded-proto') || 'https'; if (host) baseUrl = `${proto}://${host}`; } catch {}

    return {
      title: `${report.title} — Rouaa Rapports Stratégiques`,
      description: report.summary ? stripSummaryMarkdown(report.summary).slice(0, 160) : 'Rapport analytique stratégique complet',
      openGraph: { title: report.title, url: `${baseUrl}/fr/strategic-reports/${report.slug || slug}`, siteName: 'Rouaa', locale: 'fr_FR', type: 'article' },
    };
  } catch {
    return { title: 'Rouaa Rapports Stratégiques' };
  }
}

// ─── Page Component ──────────────────────────────────────────
export default async function FrStrategicReportPage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}
  let slug = rawSlug;

  if (!slug || slug === 'undefined') notFound();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="ltr" style={{ background: '#0A0E27' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>Chargement du rapport...</h1>
          <p style={{ color: '#64748B' }}>Le rapport sera affiché lorsque les données seront disponibles</p>
        </div>
      </div>
    );
  }

  // Strategy 1: Find strategic report with locale=fr
  let report = await db.economicReport.findFirst({
    where: { locale: 'fr', isPublished: true, reportType: 'strategic', OR: [{ id: slug }, { slug }] },
  });

  // Strategy 2: Any French report
  if (!report) {
    report = await db.economicReport.findFirst({
      where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
    });
  }

  // Strategy 3: Try with raw slug
  if (!report && slug !== rawSlug) {
    report = await db.economicReport.findFirst({
      where: { locale: 'fr', isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] },
    });
  }

  // Strategy 4: Strategic report nanoid suffix match
  if (!report && slug.startsWith('strategic-')) {
    const parts = slug.split('-');
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      report = await db.economicReport.findFirst({
        where: { locale: 'fr', isPublished: true, reportType: 'strategic', slug: { endsWith: `-${slugSuffix}` } },
      });
    }
  }

  // Strategy 5: Fallback — any locale
  if (!report) {
    report = await db.economicReport.findFirst({
      where: { isPublished: true, OR: [{ id: slug }, { slug }] },
    });
  }

  // Fallback: try MarketAnalysis
  if (!report) {
    const analysis: any = await db.marketAnalysis.findFirst({
      where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
    });
    if (analysis) {
      const processed = processContent(analysis.content || '{}');
      const contentJson = JSON.stringify({ sections: processed.sections, metadata: processed.metadata, dataQuality: processed.dataQuality });
      const normalizedReport = {
        id: analysis.id, title: analysis.title, slug: analysis.slug,
        summary: processed.summary || analysis.title, content: contentJson,
        reportType: 'analysis', scope: analysis.assetClass || 'strategic',
        sectors: safeParse(analysis.sectors || '[]'), countries: safeParse(analysis.countries || '[]'),
        keyIndicators: safeParse(analysis.indicators || '{}'),
        marketImpact: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore || 50,
        sourceUrls: safeParse(analysis.sourceUrls || analysis.relatedNewsIds || '[]'),
        imageUrl: analysis.imageUrl || undefined, publishedAt: analysis.publishedAt,
        createdAt: analysis.createdAt, isAnalysis: true,
      };
      const related = await db.economicReport.findMany({
        where: { locale: 'fr', isPublished: true, id: { not: analysis.id } },
        take: 4, orderBy: { publishedAt: 'desc' },
      }).catch(() => []);
      const normalizedRelated = (related || []).map((r: any) => ({
        id: r.id, title: r.title, slug: r.slug,
        reportType: r.reportType || 'daily', marketImpact: r.marketImpact || 'neutral',
        confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt,
      }));
      return <FrReportDetailClient report={normalizedReport} related={normalizedRelated} />;
    }
  }

  if (!report) notFound();

  // Process content
  let processed: { sections: Record<string, string>; metadata: Record<string, any>; dataQuality: Record<string, any>; summary: string };
  try { processed = processContent(report.content || '{}'); } catch { processed = { sections: {}, metadata: {}, dataQuality: {}, summary: report.summary || '' }; }

  const contentJson = JSON.stringify({ sections: processed.sections, metadata: processed.metadata, dataQuality: processed.dataQuality });
  const normalizedReport = {
    id: report.id, title: report.title, slug: report.slug,
    summary: processed.summary || report.summary || '', content: contentJson,
    reportType: report.reportType || 'strategic', scope: report.scope || 'strategic',
    sectors: safeParse(report.sectors || '[]'), countries: safeParse(report.countries || '[]'),
    keyIndicators: safeParse(report.keyIndicators || '{}'),
    marketImpact: report.marketImpact || 'neutral', confidenceScore: report.confidenceScore || 50,
    sourceUrls: safeParse(report.sourceUrls || '[]'),
    imageUrl: report.imageUrl || undefined, publishedAt: report.publishedAt,
    createdAt: report.createdAt,
  };

  const related = await db.economicReport.findMany({
    where: { locale: 'fr', isPublished: true, id: { not: report.id }, reportType: 'strategic' },
    take: 4, orderBy: { publishedAt: 'desc' },
  }).catch(() => []);
  const normalizedRelated = (related || []).map((r: any) => ({
    id: r.id, title: r.title, slug: r.slug,
    reportType: r.reportType || 'strategic', marketImpact: r.marketImpact || 'neutral',
    confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt,
  }));

  return <FrReportDetailClient report={normalizedReport} related={normalizedRelated} />;
}
