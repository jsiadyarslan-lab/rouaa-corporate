// ─── French Strategic Reports Page (V2 unified) ────────────────
import { Metadata } from 'next';
import { db } from '@/lib/db';
import StrategicReportsCenter from '@/components/strategic-reports/StrategicReportsCenter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Rapports Stratégiques',
  description: 'Analyses stratégiques approfondies et perspectives de marché à long terme de Rouaa',
  openGraph: {
    title: 'Rouaa — Rapports Stratégiques',
    description: 'Analyses stratégiques approfondies et perspectives de marché à long terme',
  },
};

const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };
const cleanSummary = (text: string): string => {
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
            for (const key of ['introduction', 'summary', 'overview', 'executiveSummary']) {
              if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 10) parts.push(obj[key]);
            }
            if (parts.length === 0) {
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
};

export default async function FrStrategicReportsPage() {
  let reports: any[] = [];
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      const raw = await db.economicReport.findMany({
        where: { locale: 'fr', isPublished: true, reportType: 'strategic' },
        orderBy: { publishedAt: 'desc' },
        take: 60,
        select: {
          id: true, title: true, slug: true, reportType: true,
          summary: true, scope: true, marketImpact: true,
          confidenceScore: true, publishedAt: true, createdAt: true,
          imageUrl: true, sectors: true,
        },
      });
      const seen = new Set<string>();
      reports = raw.filter(r => {
        if (!r.slug || seen.has(r.slug)) return false;
        seen.add(r.slug);
        return true;
      }).map(r => ({
        ...r,
        sectors: safeParse(r.sectors, []),
        summary: cleanSummary(r.summary || ''),
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  } catch (err: any) {
    console.error('[FR StrategicReportsPage V2] DB error:', err.message);
  }

  return <StrategicReportsCenter locale="fr" reports={reports} />;
}
