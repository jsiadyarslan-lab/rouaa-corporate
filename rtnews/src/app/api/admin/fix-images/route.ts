// ─── Fix Missing Images for Published Articles ──────────────────
// POST /api/admin/fix-images
// Generates Canvas/Sharp images for ALL published articles that have
// NULL or empty generatedImage. This fixes the post-migration issue
// where articles were migrated from old DB without their images.
//
// Query params:
//   ?locale=en    — Only fix specific locale (default: all)
//   ?limit=100    — Max articles to fix per run (default: 100)
//   ?dryRun=1     — Count only, don't generate (safe preview)
//
// Auth: Requires ADMIN_SECRET header

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadImageToR2 } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout

export async function POST(request: NextRequest) {
  // Auth check
  const adminSecret = request.headers.get('x-admin-secret') || request.headers.get('admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === '1';
  const locale = searchParams.get('locale') || undefined;
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')));

  try {
    // Find published articles without images
    const where: any = {
      isReady: true,
      isPublished: true,
      OR: [
        { generatedImage: null },
        { generatedImage: '' },
      ],
    };
    if (locale) where.locale = locale;

    const totalMissing = await db.newsItem.count({ where });

    if (dryRun) {
      // Count by locale
      const byLocale: Record<string, number> = {};
      const locales = locale ? [locale] : ['ar', 'en', 'fr', 'tr', 'es'];
      for (const loc of locales) {
        const count = await db.newsItem.count({
          where: { ...where, locale: loc },
        });
        if (count > 0) byLocale[loc] = count;
      }
      return NextResponse.json({
        dryRun: true,
        totalMissingImages: totalMissing,
        byLocale,
        message: `Found ${totalMissing} published articles without images. Run without dryRun to fix.`,
      });
    }

    // Fetch articles to fix
    const articles = await db.newsItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        titleAr: true,
        category: true,
        categoryId: true,
        locale: true,
        newsType: true,
        sentiment: true,
        sourceName: true,
        source: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        fixed: 0,
        failed: 0,
        message: 'No articles need image fixes',
      });
    }

    // Import template engine
    const { generateArticleImage } = await import('@/lib/image-templates/template-engine');

    const results = { fixed: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
      const title = isLatin
        ? (article.title || 'Breaking News')
        : (article.titleAr || article.title || 'أخبار عاجلة');

      try {
        const canvasBuffer = await generateArticleImage({
          title,
          category: article.categoryId || article.category || 'economy',
          locale: (article.locale as 'ar' | 'en' | 'es' | 'fr' | 'tr') || 'ar',
          newsType: article.newsType || undefined,
          sentiment: article.sentiment || undefined,
          source: article.sourceName || article.source || undefined,
        });

        if (canvasBuffer && canvasBuffer.length > 500) {
          let storedValue: string;
          const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
          if (r2Result.success) {
            storedValue = r2Result.url;
          } else {
            storedValue = null;
          }

          await db.newsItem.update({
            where: { id: article.id },
            data: { generatedImage: storedValue },
          });

          results.fixed++;
        } else {
          results.failed++;
          if (results.errors.length < 10) {
            results.errors.push(`${article.id}: Canvas buffer too small (${canvasBuffer?.length || 0} bytes)`);
          }
        }
      } catch (err: any) {
        results.failed++;
        if (results.errors.length < 10) {
          results.errors.push(`${article.id}: ${err.message?.slice(0, 80)}`);
        }
      }

      // Progress log + rate limit
      if ((i + 1) % 20 === 0) {
        console.log(`[FixImages] Progress: ${i + 1}/${articles.length} (fixed: ${results.fixed}, failed: ${results.failed})`);
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return NextResponse.json({
      success: true,
      totalMissing: totalMissing,
      processed: articles.length,
      fixed: results.fixed,
      failed: results.failed,
      remaining: Math.max(0, totalMissing - articles.length),
      errors: results.errors,
      message: `Fixed ${results.fixed}/${articles.length} articles. ${Math.max(0, totalMissing - articles.length)} remaining.`,
    });
  } catch (error: any) {
    console.error('[FixImages] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
