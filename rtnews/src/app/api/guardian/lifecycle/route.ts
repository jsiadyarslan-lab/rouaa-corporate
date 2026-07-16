// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Lifecycle API Route
// ═══════════════════════════════════════════════════════════════
// GET /api/guardian/lifecycle?locale=en — Get stuck articles
// POST /api/guardian/lifecycle — Recover stuck articles
// Body: { locale, articleId?, action: 'recover'|'recover-all' }
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getStuckArticles, recoverStuckArticle, recoverAllStuck } from '@/lib/pipeline/guardian';
import type { Locale } from '@/lib/pipeline/guardian';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'en') as Locale;

    const stuckArticles = await getStuckArticles(locale);

    return NextResponse.json({
      success: true,
      locale,
      stuckCount: stuckArticles.length,
      articles: stuckArticles.map(a => ({
        articleId: a.articleId,
        currentStage: a.currentStage,
        stuckMinutes: a.stuckMinutes,
        retryCount: a.retryCount,
        lifecycleState: a.lifecycleState,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse body — if no body or invalid JSON, default to recover-all-locales
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // No body provided (cron call) — recover all locales
      body = {};
    }

    const { locale, articleId, action } = body as {
      locale?: Locale;
      articleId?: string;
      action?: 'recover' | 'recover-all';
    };

    // If no locale specified, recover ALL locales (cron mode)
    if (!locale) {
      const ALL_LOCALES: Locale[] = ['ar', 'en', 'fr', 'tr', 'es'];
      const results: Record<string, { recovered: number; skipped: number }> = {};

      for (const loc of ALL_LOCALES) {
        try {
          const result = await recoverAllStuck(loc);
          results[loc] = result;
        } catch (err) {
          results[loc] = { recovered: 0, skipped: 0 };
        }
      }

      const totalRecovered = Object.values(results).reduce((sum, r) => sum + r.recovered, 0);
      const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);

      return NextResponse.json({
        success: true,
        action: 'recover-all-locales',
        results,
        totalRecovered,
        totalSkipped,
        message: `Recovered ${totalRecovered} stuck articles across all locales, skipped ${totalSkipped}`,
      });
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required when locale is specified' },
        { status: 400 }
      );
    }

    if (action === 'recover-all') {
      const result = await recoverAllStuck(locale);
      return NextResponse.json({
        success: true,
        locale,
        action: 'recover-all',
        recovered: result.recovered,
        skipped: result.skipped,
        message: `Recovered ${result.recovered} articles, skipped ${result.skipped}`,
      });
    } else if (action === 'recover' && articleId) {
      const success = await recoverStuckArticle(articleId, locale);
      return NextResponse.json({
        success,
        locale,
        articleId,
        action: 'recover',
        message: success ? `Article ${articleId} recovered` : `Failed to recover ${articleId}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'articleId is required for recover action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
