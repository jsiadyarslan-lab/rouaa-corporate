import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import { getAllCountryGprScores } from '@/lib/geopolitical/ai-gpr-index';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks — List geopolitical risks with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'ar';
    const category = searchParams.get('category');
    const riskLevel = searchParams.get('riskLevel');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Build where clause
    const where: Record<string, unknown> = {
      isPublished: true,
      locale,
    };

    if (category) {
      where.riskCategory = category;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    // V1021: Wrap DB calls in try/catch — the geopolitical_risks table may not
    // exist yet on fresh databases (db-init.ts doesn't create it). Previously
    // this threw a 500 error that crashed the entire homepage's geopolitical
    // section. Now we return an empty array + total:0 so the UI renders
    // gracefully without the section, instead of showing an error.
    let risks: any[] = [];
    let total = 0;
    try {
      [risks, total] = await Promise.all([
        db.geopoliticalRisk.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            locale: true,
            riskCategory: true,
            riskLevel: true,
            riskScore: true,
            aiGprScore: true,
            acledEventCount: true,
            acledFatalityCount: true,
            worldBankStability: true,
            gdeltTone: true,
            affectedRegions: true,
            affectedCountries: true,
            affectedAssets: true,
            scenarios: true,
            tradeRoutes: true,
            latitude: true,
            longitude: true,
            imageUrl: true,
            sourceUrls: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.geopoliticalRisk.count({ where }),
      ]);
    } catch (dbError: any) {
      // Table doesn't exist or DB not ready — return empty result
      // This is common on fresh deployments where db-init hasn't created
      // the geopolitical_risks table yet.
      console.warn('[GeopoliticalRisks] Table not ready or DB error:', dbError?.message?.slice(0, 100));
      return NextResponse.json({
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    }

    // Parse JSON string fields for each risk
    const parsedRisks = risks.map((risk) => ({
      ...risk,
      affectedRegions: safeJsonParse(risk.affectedRegions),
      affectedCountries: safeJsonParse(risk.affectedCountries),
      affectedAssets: safeJsonParse(risk.affectedAssets),
      scenarios: risk.scenarios ? safeJsonParse(risk.scenarios) : null,
      tradeRoutes: risk.tradeRoutes ? safeJsonParse(risk.tradeRoutes) : null,
      sourceUrls: safeJsonParse(risk.sourceUrls),
    }));

    // V1044: The geopolitical pipeline (src/lib/pipeline/geopolitical-pipeline.ts)
    // now populates this table automatically. The fallbacks below are kept as
    // safety nets for when the pipeline hasn't run yet or the DB is unreachable.
    if (parsedRisks.length === 0) {
      // Try realtime first (GDELT/WorldBank-backed, may be slow or fail)
      try {
        const realtimeRisks = await getRealtimeRisks(locale);
        if (realtimeRisks.length > 0) {
          const sliced = realtimeRisks.slice(offset, offset + limit);
          return NextResponse.json({
            data: sliced,
            pagination: {
              total: realtimeRisks.length,
              limit,
              offset,
              hasMore: offset + limit < realtimeRisks.length,
            },
            source: 'realtime-fallback',
          });
        }
      } catch (rtError: any) {
        console.warn('[GeopoliticalRisks] Realtime fallback failed:', rtError?.message?.slice(0, 100));
      }

      // Final fallback: built-in GPR baselines (synchronous, no HTTP)
      const gprBaselineRisks = buildGprBaselineRisks(locale, limit, offset);
      return NextResponse.json({
        data: gprBaselineRisks,
        pagination: {
          total: 15,
          limit,
          offset,
          hasMore: false,
        },
        source: 'gpr-baseline-fallback',
      });
    }

    return NextResponse.json({
      data: parsedRisks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET / list error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch geopolitical risks', details: message },
      { status: 500 }
    );
  }
}

/** Safely parse a JSON string, returning null on failure instead of the raw string. */
function safeJsonParse(value: string, fallback: unknown = null): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ─── V1043-fix3: Synchronous GPR Baseline Fallback ─────────────
// Builds geopolitical risk items from hardcoded GPR baselines (no HTTP calls).
// Used when both the DB is empty AND the realtime fetch fails/times out.
// Returns up to 15 top-risk countries sorted by AI-GPR score descending.

// Country code → display name per locale (top 15 high-risk countries only)
const GPR_BASELINE_COUNTRY_NAMES: Record<string, Record<string, { ar: string; en: string; fr: string; tr: string; es: string }>> = {
  UA: { ar: 'أوكرانيا', en: 'Ukraine', fr: 'Ukraine', tr: 'Ukrayna', es: 'Ucrania' },
  SY: { ar: 'سوريا', en: 'Syria', fr: 'Syrie', tr: 'Suriye', es: 'Siria' },
  AF: { ar: 'أفغانستان', en: 'Afghanistan', fr: 'Afghanistan', tr: 'Afganistan', es: 'Afganistán' },
  PS: { ar: 'فلسطين', en: 'Palestine', fr: 'Palestine', tr: 'Filistin', es: 'Palestina' },
  YE: { ar: 'اليمن', en: 'Yemen', fr: 'Yémen', tr: 'Yemen', es: 'Yemen' },
  RU: { ar: 'روسيا', en: 'Russia', fr: 'Russie', tr: 'Rusya', es: 'Rusia' },
  LB: { ar: 'لبنان', en: 'Lebanon', fr: 'Liban', tr: 'Lübnan', es: 'Líbano' },
  IL: { ar: 'إسرائيل', en: 'Israel', fr: 'Israël', tr: 'İsrail', es: 'Israel' },
  IQ: { ar: 'العراق', en: 'Iraq', fr: 'Irak', tr: 'Irak', es: 'Irak' },
  IR: { ar: 'إيران', en: 'Iran', fr: 'Iran', tr: 'İran', es: 'Irán' },
  KP: { ar: 'كوريا الشمالية', en: 'North Korea', fr: 'Corée du Nord', tr: 'Kuzey Kore', es: 'Corea del Norte' },
  PK: { ar: 'باكستان', en: 'Pakistan', fr: 'Pakistan', tr: 'Pakistan', es: 'Pakistán' },
  TW: { ar: 'تايوان', en: 'Taiwan', fr: 'Taïwan', tr: 'Tayvan', es: 'Taiwán' },
  CN: { ar: 'الصين', en: 'China', fr: 'Chine', tr: 'Çin', es: 'China' },
  SA: { ar: 'السعودية', en: 'Saudi Arabia', fr: 'Arabie Saoudite', tr: 'Suudi Arabistan', es: 'Arabia Saudí' },
};

function buildGprBaselineRisks(locale: string, limit: number, _offset: number): any[] {
  const allGpr = getAllCountryGprScores();
  // Sort by aiGpr descending, take top 15
  const top = allGpr
    .filter(g => GPR_BASELINE_COUNTRY_NAMES[g.countryCode])
    .sort((a, b) => b.aiGpr - a.aiGpr)
    .slice(0, 15);

  const now = new Date().toISOString();
  const loc = (locale || 'ar') as 'ar' | 'en' | 'fr' | 'tr' | 'es';

  return top.slice(0, limit).map((g) => {
    const names = GPR_BASELINE_COUNTRY_NAMES[g.countryCode][loc] || GPR_BASELINE_COUNTRY_NAMES[g.countryCode].en;
    const score = Math.round(g.aiGpr);
    const riskLevel =
      score >= 81 ? 'severe' :
      score >= 61 ? 'high' :
      score >= 41 ? 'elevated' :
      score >= 21 ? 'moderate' : 'low';
    const category =
      ['UA', 'RU', 'SY', 'IQ', 'YE', 'AF', 'PS', 'IL', 'LB'].includes(g.countryCode) ? 'conflict' :
      ['IR', 'KP', 'CN', 'TW'].includes(g.countryCode) ? 'political' :
      ['SA', 'PK'].includes(g.countryCode) ? 'political' : 'political';

    const titleTemplates: Record<string, string> = {
      ar: `تحليل المخاطر الجيوسياسية: ${names}`,
      en: `Geopolitical Risk Analysis: ${names}`,
      fr: `Analyse des Risques Géopolitiques : ${names}`,
      tr: `Jeopolitik Risk Analizi: ${names}`,
      es: `Análisis de Riesgo Geopolítico: ${names}`,
    };

    return {
      id: `gpr-baseline-${g.countryCode}`,
      title: titleTemplates[loc] || titleTemplates.en,
      slug: `${g.countryCode.toLowerCase()}-risk-analysis`,
      summary: '',
      riskCategory: category,
      riskLevel,
      riskScore: score,
      aiGprScore: g.aiGpr,
      acledEventCount: 0,
      acledFatalityCount: 0,
      worldBankStability: null,
      gdeltTone: null,
      affectedRegions: [],
      affectedCountries: [{ code: g.countryCode, name: names.ar }],
      affectedAssets: [],
      scenarios: null,
      tradeRoutes: [],
      latitude: null,
      longitude: null,
      imageUrl: null,
      publishedAt: now,
      createdAt: now,
    };
  });
}
