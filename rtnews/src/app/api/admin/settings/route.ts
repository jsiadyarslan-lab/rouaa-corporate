// ─── Admin Settings API V47 ──────────────────────────────────
// Persisted site settings via SiteSetting model
// V47: Added in-handler auth check + sanitized error responses
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// GET: Retrieve all settings (grouped)
export async function GET(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const settings = await db.siteSetting.findMany();
    const grouped: Record<string, Record<string, string>> = {};

    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    }

    return NextResponse.json({ settings: grouped });
  } catch (error) {
    return apiError(error, 'جلب الإعدادات');
  }
}

// PUT: Save settings for a group
export async function PUT(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { group, settings } = await request.json() as {
      group: string;
      settings: Record<string, string>;
    };

    if (!group || !settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const allowedGroups = ['general', 'news', 'ai', 'cache', 'system', 'pipeline', 'reports', 'stock', 'agency'];
    if (!allowedGroups.includes(group)) {
      return NextResponse.json({ error: 'مجموعة إعدادات غير صالحة' }, { status: 400 });
    }

    // Upsert each setting
    const operations = Object.entries(settings).map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key: `${group}_${key}` },
        update: { value: String(value) },
        create: { key: `${group}_${key}`, value: String(value), group, type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string' },
      })
    );

    await Promise.all(operations);

    // V102: Clear pipeline limits cache if pipeline settings were changed
    if (group === 'pipeline') {
      try {
        const { clearPipelineLimitsCache } = await import('@/lib/pipeline/config');
        clearPipelineLimitsCache();
        console.log('[Settings] Pipeline limits cache cleared — new limits take effect within 30s');
      } catch { /* non-critical */ }

      // V314: Also clear EN pipeline limits cache
      try {
        const { clearEnPipelineLimitsCache } = await import('@/lib/pipeline/en-pipeline-config');
        clearEnPipelineLimitsCache();
        console.log('[Settings] EN pipeline limits cache cleared — new limits take effect within 30s');
      } catch { /* non-critical */ }

      // V359: Also clear FR pipeline limits cache
      try {
        const { clearFrPipelineLimitsCache } = await import('@/lib/pipeline/fr-pipeline-config');
        clearFrPipelineLimitsCache();
        console.log('[Settings] FR pipeline limits cache cleared — new limits take effect within 30s');
      } catch { /* non-critical */ }

      // V381: Also clear TR pipeline limits cache
      try {
        const { clearTrPipelineLimitsCache } = await import('@/lib/pipeline/tr-pipeline-config');
        clearTrPipelineLimitsCache();
        console.log('[Settings] TR pipeline limits cache cleared — new limits take effect within 30s');
      } catch { /* non-critical */ }

      // V381: Also clear ES pipeline limits cache
      try {
        const { clearEsPipelineLimitsCache } = await import('@/lib/pipeline/es-pipeline-config');
        clearEsPipelineLimitsCache();
        console.log('[Settings] ES pipeline limits cache cleared — new limits take effect within 30s');
      } catch { /* non-critical */ }
    }

    // V381: Clear stock analysis limits cache if stock settings were changed
    if (group === 'stock') {
      try {
        const { clearStockAnalysisLimitsCache } = await import('@/lib/pipeline/publish-quota');
        clearStockAnalysisLimitsCache();
        console.log('[Settings] Stock analysis limits cache cleared — new limits take effect within 30s');
      } catch { /* non-critical */ }
    }

    // V110: Clear report schedule cache if report settings were changed
    if (group === 'reports') {
      try {
        const { clearReportScheduleCache } = await import('@/lib/report-schedule-config');
        clearReportScheduleCache();
        console.log('[Settings] Report schedule cache cleared — new schedule takes effect within 30s');
      } catch { /* non-critical */ }
    }

    console.log(`[Settings] Saved ${Object.keys(settings).length} settings for group: ${group}`);

    return NextResponse.json({
      success: true,
      message: `تم حفظ إعدادات ${group} بنجاح`,
    });
  } catch (error) {
    return apiError(error, 'حفظ الإعدادات');
  }
}
