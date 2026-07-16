// ─── Stock Analysis List/Query API Route ──────────────────────
// GET /api/stock-analysis?locale=ar&symbol=AAPL&limit=20&signal=bullish&sector=Technology
//
// Query Parameters:
//   locale  - ar/en/fr (default: ar)
//   symbol  - optional, get latest analysis for a specific symbol
//   limit   - number of results (default 20, max 50)
//   signal  - optional filter: bullish/bearish/neutral
//   sector  - optional filter by sector
//
// If `symbol` is provided, returns the latest analysis for that symbol+locale
// with full data including company profile. Otherwise returns a paginated list.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureStockTablesExist } from '@/lib/db-migrate-stock';

export const dynamic = 'force-dynamic';

// ─── Helper: safely parse JSON strings ────────────────────────

function safeJsonParse(value: string | null | undefined): unknown {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// ─── GET Handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Auto-migrate: ensure stock tables exist (runs once, then cached)
    // Use a non-blocking approach: try migration, but don't 503 on transient failures
    const tablesReady = await ensureStockTablesExist();
    if (!tablesReady) {
      // Instead of hard 503, return an empty result so the client doesn't crash
      // The migration will retry on the next request after cooldown
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      const locale = searchParams.get('locale') || 'ar';
      console.warn(`[StockAPI] Tables not ready for action=${action} — returning empty result`);
      
      if (action === 'screener' || action === 'list') {
        return NextResponse.json({
          status: 'ok', locale, page: 1, limit: 20, total: 0, totalPages: 0,
          analyses: [],
          timestamp: new Date().toISOString(),
        });
      }
      if (action === 'status') {
        return NextResponse.json({
          status: 'degraded', message: 'Database migration pending',
          counts: { total: 0, today: 0, byLocale: { en: 0, ar: 0, fr: 0 }, bySignal: { bullish: 0, bearish: 0, neutral: 0 }, byMarket: { sp500: 0, cac40: 0, tadawul: 0 }, companies: 0 },
          availableSymbols: { sp500: 30, cac40: 16, tadawul: 8 },
          timestamp: new Date().toISOString(),
        });
      }
      return NextResponse.json(
        { status: 'error', message: 'Stock analysis database is temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ── Action-based endpoints ──────────────────────────────
    if (action === 'status') {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const [
        totalAnalyses,
        todayAnalyses,
        enAnalyses,
        arAnalyses,
        frAnalyses,
        trAnalyses,
        bullishCount,
        bearishCount,
        neutralCount,
        sp500Count,
        cac40Count,
        tadawulCount,
        companyCount,
      ] = await Promise.all([
        db.stockAnalysis.count(),
        db.stockAnalysis.count({ where: { createdAt: { gte: todayStart } } }),
        db.stockAnalysis.count({ where: { locale: 'en' } }),
        db.stockAnalysis.count({ where: { locale: 'ar' } }),
        db.stockAnalysis.count({ where: { locale: 'fr' } }),
        db.stockAnalysis.count({ where: { locale: 'tr' } }),
        db.stockAnalysis.count({ where: { overallSignal: 'bullish' } }),
        db.stockAnalysis.count({ where: { overallSignal: 'bearish' } }),
        db.stockAnalysis.count({ where: { overallSignal: 'neutral' } }),
        db.stockAnalysis.count({ where: { marketType: 'sp500' } }),
        db.stockAnalysis.count({ where: { marketType: 'cac40' } }),
        db.stockAnalysis.count({ where: { marketType: 'tadawul' } }),
        db.companyProfile.count(),
      ]);

      return NextResponse.json({
        status: 'ok',
        pipeline: 'stock-analysis',
        counts: {
          total: totalAnalyses,
          today: todayAnalyses,
          trAnalyses,
          byLocale: { en: enAnalyses, ar: arAnalyses, fr: frAnalyses, tr: trAnalyses },
          bySignal: { bullish: bullishCount, bearish: bearishCount, neutral: neutralCount },
          byMarket: { sp500: sp500Count, cac40: cac40Count, tadawul: tadawulCount },
          companies: companyCount,
        },
        availableSymbols: { sp500: 30, cac40: 16, tadawul: 8 },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'run') {
      const locale = (searchParams.get('locale') || 'en') as 'en' | 'ar' | 'fr' | 'tr';
      const maxStocks = Math.min(parseInt(searchParams.get('maxStocks') || '5', 10), 30);

      if (!['en', 'ar', 'fr', 'tr'].includes(locale)) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid locale. Must be: en, ar, fr, or tr' },
          { status: 400 }
        );
      }

      // Pre-flight check: test if quote fetching works
      const { getQuote, getHistoricalData, getApiStatus } = await import('@/lib/financial-apis');
      const apiStatus = getApiStatus();
      const testQuote = await getQuote('AAPL');
      const testHistory = await getHistoricalData('AAPL', 5);

      console.log(`[StockAPI] Pre-flight: API status=${JSON.stringify(apiStatus)}, AAPL quote=${testQuote ? '$' + testQuote.price : 'null'}, AAPL history=${testHistory?.length || 0} points`);

      console.log(`[StockAPI] Triggering pipeline: locale=${locale}, maxStocks=${maxStocks}`);
      const { runStockAnalysisPipeline } = await import('@/lib/pipeline/stock-analysis-pipeline');
      const result = await runStockAnalysisPipeline(locale, maxStocks);

      return NextResponse.json({
        status: 'ok',
        message: `Stock analysis pipeline completed for locale=${locale}`,
        locale,
        maxStocks,
        result,
        preflight: {
          apiStatus,
          testQuote: testQuote ? { symbol: testQuote.symbol, price: testQuote.price } : null,
          testHistory: testHistory?.length || 0,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'list') {
      const locale = searchParams.get('locale') || 'en';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const marketType = searchParams.get('marketType') || undefined;
      const signal = searchParams.get('signal') || undefined;
      const sector = searchParams.get('sector') || undefined;

      // First try exact locale, then fall back to 'en' if no results
      let where: any = { isPublished: true, locale };
      if (marketType) where.marketType = marketType;
      if (signal) where.overallSignal = signal;
      // Sector filter: match both stockAnalysis.sector AND company.sector
      // (analysis.sector is often null, company profile has the correct value)
      if (sector) {
        where.OR = [
          { sector },
          { company: { sector } },
        ];
      }

      let [analyses, total] = await Promise.all([
        db.stockAnalysis.findMany({
          where,
          select: {
            id: true, symbol: true, slug: true, title: true, summary: true,
            locale: true, price: true, change: true, changePercent: true,
            overallSignal: true, overallScore: true, confidenceScore: true,
            riskLevel: true, marketType: true, sector: true,
            volume: true, marketCap: true,
            tradeSetup: true,
            publishedAt: true, validUntil: true, createdAt: true,
            // Include company profile to get real sector name
            company: {
              select: { name: true, nameAr: true, nameFr: true, sector: true, logoUrl: true, country: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.stockAnalysis.count({ where }),
      ]);

      // If no results for the requested locale, fall back to English
      // This ensures stock analysis pages always show data even if the pipeline
      // hasn't been run for this specific locale yet
      if (total === 0 && locale !== 'en') {
        const fallbackWhere: any = { isPublished: true, locale: 'en' };
        if (marketType) fallbackWhere.marketType = marketType;
        if (signal) fallbackWhere.overallSignal = signal;
        if (sector) {
          fallbackWhere.OR = [
            { sector },
            { company: { sector } },
          ];
        }
        [analyses, total] = await Promise.all([
          db.stockAnalysis.findMany({
            where: fallbackWhere,
            select: {
              id: true, symbol: true, slug: true, title: true, summary: true,
              locale: true, price: true, change: true, changePercent: true,
              overallSignal: true, overallScore: true, confidenceScore: true,
              riskLevel: true, marketType: true, sector: true,
              volume: true, marketCap: true,
              tradeSetup: true,
              publishedAt: true, validUntil: true, createdAt: true,
              company: {
                select: { name: true, nameAr: true, nameFr: true, sector: true, logoUrl: true, country: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.stockAnalysis.count({ where: fallbackWhere }),
        ]);
      }

      return NextResponse.json({
        status: 'ok',
        locale, page, limit, total,
        totalPages: Math.ceil(total / limit),
        analyses: analyses.map(a => ({
          ...a,
          tradeSetup: safeJsonParse(a.tradeSetup as string),
          // Prefer the company profile sector over the analysis sector
          // (analysis sector is often null, company profile has the correct value)
          effectiveSector: a.company?.sector || a.sector || null,
          effectiveMarketType: a.marketType || null,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'companies') {
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
      const search = searchParams.get('search') || undefined;
      const sector = searchParams.get('sector') || undefined;

      const where: any = {};
      if (search) {
        where.OR = [
          { symbol: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { nameAr: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (sector) where.sector = sector;

      const [companies, total] = await Promise.all([
        db.companyProfile.findMany({
          where,
          select: {
            id: true, symbol: true, name: true, nameAr: true, nameFr: true,
            exchange: true, sector: true, industry: true, country: true,
            marketCap: true, peRatio: true, eps: true, dividendYield: true,
            beta: true, ceo: true, logoUrl: true, website: true, employees: true,
            lastUpdated: true, createdAt: true,
            _count: { select: { analyses: true } },
          },
          orderBy: { marketCap: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.companyProfile.count({ where }),
      ]);

      return NextResponse.json({
        status: 'ok', page, limit, total,
        totalPages: Math.ceil(total / limit),
        companies,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'compare') {
      const symbols = searchParams.get('symbols')?.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) || [];
      if (symbols.length === 0 || symbols.length > 5) {
        return NextResponse.json({ status: 'error', message: 'Provide 1-5 comma-separated symbols' }, { status: 400 });
      }

      const analyses = await db.stockAnalysis.findMany({
        where: { symbol: { in: symbols }, isPublished: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, symbol: true, title: true, summary: true,
          price: true, change: true, changePercent: true,
          overallSignal: true, overallScore: true, confidenceScore: true,
          riskLevel: true, sector: true, marketCap: true,
          peRatio: true, eps: true, keyMetrics: true,
          createdAt: true,
          company: {
            select: { name: true, nameAr: true, nameFr: true, sector: true, logoUrl: true, country: true },
          },
        },
      });

      // Deduplicate by symbol (keep latest)
      const uniqueAnalyses = new Map<string, typeof analyses[0]>();
      for (const a of analyses) {
        if (!uniqueAnalyses.has(a.symbol)) uniqueAnalyses.set(a.symbol, a);
      }

      return NextResponse.json({
        status: 'ok',
        comparisons: Array.from(uniqueAnalyses.values()).map(a => ({
          ...a,
          keyMetrics: safeJsonParse(a.keyMetrics as string),
        })),
      });
    }

    if (action === 'screener') {
      const signal = searchParams.get('signal') || undefined;
      const sector = searchParams.get('sector') || undefined;
      const minMarketCap = searchParams.get('minMarketCap') ? parseInt(searchParams.get('minMarketCap')!) : undefined;
      const maxMarketCap = searchParams.get('maxMarketCap') ? parseInt(searchParams.get('maxMarketCap')!) : undefined;
      const minPe = searchParams.get('minPe') ? parseFloat(searchParams.get('minPe')!) : undefined;
      const maxPe = searchParams.get('maxPe') ? parseFloat(searchParams.get('maxPe')!) : undefined;
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const locale = searchParams.get('locale') || 'en';

      const where: any = { isPublished: true, locale };
      if (signal) where.overallSignal = signal;
      if (sector) where.sector = sector;
      if (minMarketCap) where.marketCap = { ...where.marketCap, gte: minMarketCap };
      if (maxMarketCap) where.marketCap = { ...where.marketCap, lte: maxMarketCap };
      if (minPe || maxPe) {
        where.peRatio = { ...where.peRatio, ...(minPe && { gte: minPe }), ...(maxPe && { lte: maxPe }) };
      }

      let [analyses, total] = await Promise.all([
        db.stockAnalysis.findMany({
          where,
          select: {
            id: true, symbol: true, title: true,
            price: true, change: true, changePercent: true,
            overallSignal: true, overallScore: true, confidenceScore: true,
            riskLevel: true, sector: true, marketCap: true,
            peRatio: true, eps: true,
            company: { select: { name: true, nameAr: true, nameFr: true, logoUrl: true } },
          },
          orderBy: { marketCap: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.stockAnalysis.count({ where }),
      ]);

      // Fallback to English if no results for the requested locale
      if (total === 0 && locale !== 'en') {
        const fallbackWhere: any = { isPublished: true, locale: 'en' };
        if (signal) fallbackWhere.overallSignal = signal;
        if (sector) fallbackWhere.sector = sector;
        if (minMarketCap) fallbackWhere.marketCap = { ...fallbackWhere.marketCap, gte: minMarketCap };
        if (maxMarketCap) fallbackWhere.marketCap = { ...fallbackWhere.marketCap, lte: maxMarketCap };
        if (minPe || maxPe) {
          fallbackWhere.peRatio = { ...fallbackWhere.peRatio, ...(minPe && { gte: minPe }), ...(maxPe && { lte: maxPe }) };
        }
        [analyses, total] = await Promise.all([
          db.stockAnalysis.findMany({
            where: fallbackWhere,
            select: {
              id: true, symbol: true, title: true,
              price: true, change: true, changePercent: true,
              overallSignal: true, overallScore: true, confidenceScore: true,
              riskLevel: true, sector: true, marketCap: true,
              peRatio: true, eps: true,
              company: { select: { name: true, nameAr: true, nameFr: true, logoUrl: true } },
            },
            orderBy: { marketCap: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.stockAnalysis.count({ where: fallbackWhere }),
        ]);
      }

      return NextResponse.json({
        status: 'ok', page, limit, total,
        totalPages: Math.ceil(total / limit),
        analyses,
      });
    }

    // ── Parse and validate query parameters ──────────────────
    const locale = searchParams.get('locale') || 'ar';
    const symbol = searchParams.get('symbol')?.trim().toUpperCase() || undefined;
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(1, limitParam), 50);
    const signal = searchParams.get('signal')?.toLowerCase() || undefined;
    const sector = searchParams.get('sector')?.trim() || undefined;

    // Validate locale
    if (!['ar', 'en', 'fr', 'tr', 'es'].includes(locale)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid locale. Must be one of: ar, en, fr, tr, es' },
        { status: 400 }
      );
    }

    // Validate signal if provided
    if (signal && !['bullish', 'bearish', 'neutral'].includes(signal)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid signal. Must be one of: bullish, bearish, neutral' },
        { status: 400 }
      );
    }

    // ── Single Symbol Lookup ─────────────────────────────────
    if (symbol) {
      const analysis = await db.stockAnalysis.findFirst({
        where: {
          symbol,
          locale,
          isPublished: true,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              symbol: true,
              name: true,
              nameAr: true,
              nameFr: true,
              exchange: true,
              sector: true,
              industry: true,
              description: true,
              marketCap: true,
              peRatio: true,
              eps: true,
              dividendYield: true,
              beta: true,
              ceo: true,
              country: true,
              website: true,
              employees: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!analysis) {
        return NextResponse.json(
          {
            status: 'error',
            message: `No published analysis found for symbol "${symbol}" in locale "${locale}"`,
            symbol,
            locale,
          },
          { status: 404 }
        );
      }

      // Parse JSON fields for client consumption
      const parsedAnalysis = {
        ...analysis,
        technicalData: safeJsonParse(analysis.technicalData as string),
        tradeSetup: safeJsonParse(analysis.tradeSetup as string),
        keyMetrics: safeJsonParse(analysis.keyMetrics as string),
        indicators: safeJsonParse(analysis.indicators as string),
        sourceUrls: safeJsonParse(analysis.sourceUrls as string),
        relatedNewsIds: safeJsonParse(analysis.relatedNewsIds as string),
        relatedReportIds: safeJsonParse(analysis.relatedReportIds as string),
      };

      return NextResponse.json({
        status: 'ok',
        symbol,
        locale,
        analysis: parsedAnalysis,
        company: analysis.company,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Paginated List ───────────────────────────────────────
    const where: Record<string, unknown> = {
      isPublished: true,
      locale,
    };

    if (signal) {
      where.overallSignal = signal;
    }

    if (sector) {
      where.sector = sector;
    }

    const [analyses, total] = await Promise.all([
      db.stockAnalysis.findMany({
        where,
        select: {
          id: true,
          symbol: true,
          slug: true,
          locale: true,
          title: true,
          summary: true,
          price: true,
          change: true,
          changePercent: true,
          overallSignal: true,
          overallScore: true,
          confidenceScore: true,
          riskLevel: true,
          sector: true,
          marketType: true,
          assetClass: true,
          marketCap: true,
          peRatio: true,
          eps: true,
          tradeSetup: true,
          keyMetrics: true,
          isPublished: true,
          publishedAt: true,
          validUntil: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              nameAr: true,
              nameFr: true,
              exchange: true,
              sector: true,
              logoUrl: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.stockAnalysis.count({ where }),
    ]);

    // Parse JSON fields in list items
    const parsedAnalyses = analyses.map((a) => ({
      ...a,
      tradeSetup: safeJsonParse(a.tradeSetup as string),
      keyMetrics: safeJsonParse(a.keyMetrics as string),
    }));

    return NextResponse.json({
      status: 'ok',
      locale,
      limit,
      total,
      analyses: parsedAnalyses,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[StockAnalysis API] Error:', message);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch stock analyses', error: message },
      { status: 500 }
    );
  }
}
