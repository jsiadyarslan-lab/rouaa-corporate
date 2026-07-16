import { db } from '@/lib/db';
import StrategicReportsCenter from '@/components/strategic-reports/StrategicReportsCenter';

// CRITICAL: force-dynamic prevents ISR caching — calendar page taught us
// that revalidate=300 leaves stale HTML for up to 5 min after deploy.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'التقارير الاستراتيجية',
  description: 'تقارير استراتيجية معمقة تحلل التطورات الجيوسياسية والاقتصادية وتأثيرها على الأسواق العربية والعالمية',
};

const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

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
            if (obj.introduction || obj.summary || obj.overview || obj.executiveSummary) {
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
  // V2: Strip section markers like "الأهمية الاستراتيجية بالأرقام" that aren't real summaries
  // These are typically section headings that got captured by accident
  let result = cleaned.slice(0, 300);
  // Remove markdown headings
  result = result.replace(/^#+\s+/gm, '');
  // Remove "بيانات غير كافية" style phrases that indicate missing data
  result = result.replace(/بيانات غير كافية[^.]*\.\s*/gi, '');
  // Collapse whitespace
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

export default async function StrategicReportsPage() {
  // Fetch all strategic reports — Arabic locale only
  // Use distinct on slug to prevent duplicates (a known issue in DB)
  const strategicReports = await db.economicReport.findMany({
    where: { isPublished: true, reportType: 'strategic', locale: 'ar' },
    orderBy: { publishedAt: 'desc' },
    take: 60,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      reportType: true,
      scope: true,
      marketImpact: true,
      confidenceScore: true,
      imageUrl: true,
      sectors: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  // Dedupe by slug — keep the most recent
  const seenSlugs = new Set<string>();
  const dedupedReports = strategicReports.filter(r => {
    if (!r.slug || seenSlugs.has(r.slug)) return false;
    seenSlugs.add(r.slug);
    return true;
  });

  const parsedReports = dedupedReports.map(r => ({
    ...r,
    sectors: safeParse(r.sectors, []),
    summary: cleanReportSummary(r.summary || ''),
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return <StrategicReportsCenter locale="ar" reports={parsedReports} />;
}
