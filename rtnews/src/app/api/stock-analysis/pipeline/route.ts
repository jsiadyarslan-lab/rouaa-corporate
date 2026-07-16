// ─── Stock Analysis Pipeline API Route ────────────────────────
// POST /api/stock-analysis/pipeline
//   Body: { locale: 'en'|'ar'|'fr'|'tr', maxStocks?: number (default 10, max 30) }
//   Triggers the stock analysis pipeline for the given locale.
//   Returns: { generated, published, errors }
//
// GET /api/stock-analysis/pipeline
//   Returns the last 5 PipelineRun records where trigger contains 'stock'

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureStockTablesExist } from '@/lib/db-migrate-stock';

export const dynamic = 'force-dynamic';

// ─── POST: Trigger Pipeline ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auto-migrate: ensure stock tables exist
    await ensureStockTablesExist();

    const body = await request.json();
    const locale = body.locale || 'en';
    const maxStocksRaw = parseInt(String(body.maxStocks || '10'), 10);
    const maxStocks = Math.min(Math.max(1, isNaN(maxStocksRaw) ? 10 : maxStocksRaw), 30);

    // Validate locale
    if (!['en', 'ar', 'fr', 'tr'].includes(locale)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid locale. Must be one of: en, ar, fr, tr' },
        { status: 400 }
      );
    }

    console.log(`[StockPipeline API] Triggering pipeline: locale=${locale}, maxStocks=${maxStocks}`);

    // Dynamic import to avoid loading the heavy pipeline module unless needed
    const { runStockAnalysisPipeline } = await import('@/lib/pipeline/stock-analysis-pipeline');
    const result = await runStockAnalysisPipeline(locale as 'en' | 'ar' | 'fr' | 'tr', maxStocks);

    return NextResponse.json({
      status: 'ok',
      message: `Stock analysis pipeline completed for locale=${locale}`,
      locale,
      maxStocks,
      result: {
        generated: result.generated,
        published: result.published,
        errors: result.errors,
        errorDetails: result.errorDetails || [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[StockPipeline API] Error triggering pipeline:', message);
    return NextResponse.json(
      { status: 'error', message: 'Failed to run stock analysis pipeline', error: message },
      { status: 500 }
    );
  }
}

// ─── GET: Pipeline Status ────────────────────────────────────

export async function GET() {
  try {
    // Fetch last 5 PipelineRun records where trigger contains 'stock'
    const pipelineRuns = await db.pipelineRun.findMany({
      where: {
        trigger: {
          contains: 'stock',
          mode: 'insensitive',
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        trigger: true,
        articlesPublished: true,
        articlesSkipped: true,
        articlesFailed: true,
        totalDuration: true,
        summary: true,
        error: true,
        startedAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      status: 'ok',
      recentRuns: pipelineRuns,
      count: pipelineRuns.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[StockPipeline API] Error fetching pipeline status:', message);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch pipeline status', error: message },
      { status: 500 }
    );
  }
}
