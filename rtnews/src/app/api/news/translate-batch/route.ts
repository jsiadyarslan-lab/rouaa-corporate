// ─── Batch Translation Endpoint V48 ────────────────────────────
// ADMIN-ONLY: Translates multiple news items from English to Arabic.
// V48: Auth is now handled by middleware.ts — removed custom isAuthorized()
// that used hardcoded 'rouaa-cron' header (security bypass).
import { NextResponse } from 'next/server';
import { translateToArabic } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {

  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Limit batch size to prevent overload
    const batchItems = items.slice(0, 10);
    const CONCURRENCY = 3; // Translate 3 items at a time

    const translations: Record<string, { translatedTitle: string; translatedSummary: string }> = {};

    // Process in small concurrent batches
    for (let i = 0; i < batchItems.length; i += CONCURRENCY) {
      const chunk = batchItems.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        chunk.map(async (item: { id: string; title: string; summary?: string }) => {
          try {
            const translation = await translateToArabic(item.title, item.summary || '');
            const isArabic = translation.translatedTitle && /[\u0600-\u06FF]/.test(translation.translatedTitle);
            return {
              id: item.id,
              translatedTitle: isArabic ? translation.translatedTitle : undefined,
              translatedSummary: isArabic && translation.translatedSummary && /[\u0600-\u06FF]/.test(translation.translatedSummary)
                ? translation.translatedSummary
                : undefined,
            };
          } catch {
            return { id: item.id, translatedTitle: undefined, translatedSummary: undefined };
          }
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.translatedTitle) {
          translations[result.value.id] = {
            translatedTitle: result.value.translatedTitle,
            translatedSummary: result.value.translatedSummary || '',
          };
        }
      }
    }

    return NextResponse.json({
      translations,
      count: Object.keys(translations).length,
      total: batchItems.length,
    });

  } catch (error: any) {
    console.error('Batch translation error:', error);
    return NextResponse.json({
      error: error.message || 'Batch translation failed',
      translations: {},
    }, { status: 500 });
  }
}
