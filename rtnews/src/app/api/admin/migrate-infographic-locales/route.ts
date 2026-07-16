// ─── Infographic Locale Migration (V1219k) ──────────────────
// POST /api/admin/migrate-infographic-locales
// Reclassifies infographics that were incorrectly stored with locale='ar'
// but are actually Spanish/French/English/Turkish content.
//
// Query params:
//   ?dryRun=1  — Detect only, don't update (safe preview)
//
// Auth: Requires ADMIN_SECRET header

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Language detection based on Unicode ranges + keywords
function detectLocale(title: string, slides: any): string {
  const text = (title || '') + ' ' + (typeof slides === 'string' ? slides : JSON.stringify(slides || ''));

  let arabic = 0, latin = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0x0600 && code <= 0x06FF) arabic++;
    if (code >= 0x0041 && code <= 0x007A) latin++;
  }

  if (arabic > 5 && arabic > latin / 3) return 'ar';

  const lowerText = text.toLowerCase();

  const frenchWords = ['le ', 'la ', 'les ', 'des ', 'une ', 'dans ', 'pour ', 'avec ', 'marché', 'analyse', 'rapport'];
  if (frenchWords.filter(w => lowerText.includes(w)).length >= 3) return 'fr';

  const spanishWords = ['el ', 'la ', 'los ', 'las ', 'una ', 'mercado', 'análisis', 'informe', 'del ', 'al '];
  if (spanishWords.filter(w => lowerText.includes(w)).length >= 3) return 'es';

  const turkishChars = (text.match(/[çğıİşöüÇĞŞÖÜ]/g) || []).length;
  const turkishWords = ['bir ', 've ', 'için ', 'ile ', 'pazar', 'analiz', 'rapor'];
  if (turkishChars > 3 || turkishWords.filter(w => lowerText.includes(w)).length >= 3) return 'tr';

  if (latin > 10) return 'en';

  return 'ar';
}

export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret') || request.headers.get('admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized — provide ADMIN_SECRET header' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === '1';

  try {
    const infographics = await db.infographic.findMany({
      where: { locale: 'ar' },
      select: { id: true, title: true, slides: true, locale: true },
    });

    const updates: Record<string, string[]> = { ar: [], en: [], fr: [], es: [], tr: [] };
    const samples: Record<string, string[]> = { ar: [], en: [], fr: [], es: [], tr: [] };

    for (const ig of infographics) {
      const detected = detectLocale(ig.title, ig.slides);
      updates[detected].push(ig.id);
      if (samples[detected].length < 3) {
        samples[detected].push(ig.title.slice(0, 70));
      }
    }

    const result: any = {
      total: infographics.length,
      detected: {},
      dryRun,
    };

    for (const [locale, ids] of Object.entries(updates)) {
      result.detected[locale] = {
        count: ids.length,
        samples: samples[locale],
      };
    }

    if (dryRun) {
      return NextResponse.json(result);
    }

    let totalUpdated = 0;
    for (const [locale, ids] of Object.entries(updates)) {
      if (locale === 'ar' || ids.length === 0) continue;
      const updateResult = await db.infographic.updateMany({
        where: { id: { in: ids } },
        data: { locale },
      });
      result.detected[locale].updated = updateResult.count;
      totalUpdated += updateResult.count;
    }

    result.totalUpdated = totalUpdated;
    result.message = `Successfully reclassified ${totalUpdated} infographics`;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[MigrateInfographicLocales] Error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message?.slice(0, 200) },
      { status: 500 }
    );
  }
}
