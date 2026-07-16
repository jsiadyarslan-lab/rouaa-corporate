// ─── Integration: Market Scanner Proxy V2 ─────────────────────
// Proxies scanner data from the trading platform.
// The scanner is @Public() on the trading platform (no API key needed),
// but we still use integration auth when available for better logging.
//
// V2: Added local fallback when trading platform scanner returns
//     null/empty data or is unavailable. Uses CoinGecko prices
//     to generate realistic scanner data.
//
// Endpoints proxied:
//   GET /api/integration/scanner?mode=scan        → Full market scan
//   GET /api/integration/scanner?mode=heatmap      → Heatmap data
//   GET /api/integration/scanner?mode=analysis&symbol=BTC/USD → Deep analysis
//   GET /api/integration/scanner?mode=multi-tf&symbol=BTC/USD → Multi-timeframe
//   GET /api/integration/scanner?mode=overview     → Market overview + sentiment

import { NextRequest, NextResponse } from 'next/server';
import { fetchFromTradingPlatform, authenticateIntegrationRequest, isCircuitClosed } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';
import { generateLocalScannerOverview, generateLocalHeatmap, canGenerateLocalScanner } from '@/lib/local-scanner';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { rateLimited } = authenticateIntegrationRequest(request, 'signals');
  if (rateLimited) {
    return NextResponse.json({ error: 'تم تجاوز حد الطلبات' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'overview';
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe') || '1h';
  const category = searchParams.get('category');

  const cache = getSyncCache();

  try {
    switch (mode) {
      case 'scan':
        return await handleScan(cache, timeframe, category);
      case 'heatmap':
        return await handleHeatmap(cache, category);
      case 'analysis':
        if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
        return await handleAnalysis(cache, symbol);
      case 'multi-tf':
        if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
        return await handleMultiTF(cache, symbol);
      case 'overview':
        return await handleOverview(cache);
      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[Scanner Proxy] mode=${mode} failed:`, error?.message);
    return NextResponse.json({ error: 'فشل في جلب بيانات السكانر' }, { status: 502 });
  }
}

async function handleScan(cache: any, timeframe: string, category: string | null) {
  const cacheKey = `scanner:scan:${timeframe}:${category || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      let path = `/api/scanner/scan?timeframe=${encodeURIComponent(timeframe)}`;
      if (category) path += `&category=${encodeURIComponent(category)}`;

      const response = await fetchFromTradingPlatform(path);
      if (response.ok) {
        const data = await response.json();
        if (data && (data.data?.length > 0 || data.items?.length > 0 || Array.isArray(data) && data.length > 0)) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
        }
      }
    } catch (error: any) {
      console.warn('[Scanner Scan] TP failed, using local fallback:', error?.message);
    }
  }

  // Local fallback: use scanner overview as scan data
  if (canGenerateLocalScanner()) {
    try {
      const overview = await generateLocalScannerOverview();
      const data = {
        success: true,
        data: overview.items,
        count: overview.totalScanned,
        source: 'local-fallback',
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    } catch (error: any) {
      console.warn('[Scanner Scan] Local fallback failed:', error?.message);
    }
  }

  return NextResponse.json({ error: 'فشل في جلب بيانات المسح' }, { status: 502 });
}

async function handleHeatmap(cache: any, category: string | null) {
  const cacheKey = `scanner:heatmap:${category || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      let path = '/api/scanner/heatmap';
      if (category) path += `?category=${encodeURIComponent(category)}`;

      const response = await fetchFromTradingPlatform(path);
      if (response.ok) {
        const data = await response.json();
        if (data && (data.data?.length > 0 || (Array.isArray(data) && data.length > 0))) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
        }
      }
    } catch (error: any) {
      console.warn('[Scanner Heatmap] TP failed, using local fallback:', error?.message);
    }
  }

  // Local fallback
  if (canGenerateLocalScanner()) {
    try {
      const heatmap = await generateLocalHeatmap();
      const data = { success: true, data: heatmap, source: 'local-fallback' };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    } catch (error: any) {
      console.warn('[Scanner Heatmap] Local fallback failed:', error?.message);
    }
  }

  return NextResponse.json({ success: true, data: [], source: 'unavailable' });
}

async function handleAnalysis(cache: any, symbol: string) {
  // Normalize: BTC-USDT → BTC/USD for trading platform
  const normalized = symbol.replace(/-/g, '/');
  const cacheKey = `scanner:analysis:${normalized}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform(
        `/api/scanner/analysis/${encodeURIComponent(normalized)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
        }
      }
    } catch (error: any) {
      console.warn('[Scanner Analysis] TP failed:', error?.message);
    }
  }

  // Local fallback: basic analysis from quote data
  try {
    const { getQuote } = await import('@/lib/financial-apis');
    const symbolMap: Record<string, string> = {
      'BTC/USDT': 'BINANCE:BTCUSDT',
      'ETH/USDT': 'BINANCE:ETHUSDT',
      'SOL/USDT': 'BINANCE:SOLUSDT',
      'XAU/USD': 'OANDA:XAU_USD',
      'XAG/USD': 'OANDA:XAG_USD',
      'EUR/USD': 'OANDA:EUR_USD',
      'GBP/USD': 'OANDA:GBP_USD',
    };
    const localSymbol = symbolMap[normalized] || normalized;
    const quote = await getQuote(localSymbol);

    if (quote && quote.price > 0) {
      const changePercent = quote.changePercent || 0;
      const technicalScore = Math.max(5, Math.min(95, Math.round(50 + changePercent * 8)));
      const rsi = Math.max(15, Math.min(85, Math.round(50 + changePercent * 5)));

      const data = {
        success: true,
        data: {
          symbol: normalized,
          price: quote.price,
          change: changePercent,
          technicalScore,
          rsi,
          direction: changePercent > 0.3 ? 'BUY' : changePercent < -0.3 ? 'SELL' : 'NEUTRAL',
          confidence: Math.min(90, Math.max(30, Math.round(40 + Math.abs(changePercent) * 8))),
        },
        source: 'local-fallback',
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    }
  } catch (error: any) {
    console.warn('[Scanner Analysis] Local fallback failed:', error?.message);
  }

  return NextResponse.json({ success: false, error: 'فشل في جلب التحليل' }, { status: 502 });
}

async function handleMultiTF(cache: any, symbol: string) {
  const normalized = symbol.replace(/-/g, '/');
  const cacheKey = `scanner:multi-tf:${normalized}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform(
        `/api/scanner/multi-tf/${encodeURIComponent(normalized)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
        }
      }
    } catch (error: any) {
      console.warn('[Scanner Multi-TF] TP failed:', error?.message);
    }
  }

  // Local fallback: generate basic multi-timeframe data
  try {
    const { getQuote } = await import('@/lib/financial-apis');
    const symbolMap: Record<string, string> = {
      'BTC/USDT': 'BINANCE:BTCUSDT',
      'ETH/USDT': 'BINANCE:ETHUSDT',
      'XAU/USD': 'OANDA:XAU_USD',
      'EUR/USD': 'OANDA:EUR_USD',
    };
    const localSymbol = symbolMap[normalized] || normalized;
    const quote = await getQuote(localSymbol);

    if (quote && quote.price > 0) {
      const change = quote.changePercent || 0;
      const data = {
        success: true,
        data: {
          symbol: normalized,
          timeframes: {
            '1h': { direction: change > 0 ? 'BUY' : 'SELL', score: Math.round(50 + change * 5) },
            '4h': { direction: change > 0.5 ? 'BUY' : change < -0.5 ? 'SELL' : 'NEUTRAL', score: Math.round(50 + change * 4) },
            '1d': { direction: change > 1 ? 'BUY' : change < -1 ? 'SELL' : 'NEUTRAL', score: Math.round(50 + change * 3) },
            '1w': { direction: 'NEUTRAL', score: 50 },
          },
          confluence: change > 0.5 ? 'bullish' : change < -0.5 ? 'bearish' : 'neutral',
        },
        source: 'local-fallback',
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    }
  } catch (error: any) {
    console.warn('[Scanner Multi-TF] Local fallback failed:', error?.message);
  }

  return NextResponse.json({ success: false, error: 'فشل في جلب التحليل متعدد الأطر' }, { status: 502 });
}

async function handleOverview(cache: any) {
  const cacheKey = 'scanner:overview';
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform('/api/scanner/overview');
      if (response.ok) {
        const data = await response.json();
        // Only use TP data if it has actual content
        if (data && data.data !== null && data.data !== undefined) {
          if (Array.isArray(data.data) && data.data.length > 0) {
            await cache.set(cacheKey, data, CacheTTL.SIGNALS);
            return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
          }
          if (data.data && typeof data.data === 'object' && (data.data.items?.length > 0 || data.data.topGainers?.length > 0)) {
            await cache.set(cacheKey, data, CacheTTL.SIGNALS);
            return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
          }
        }
      }
    } catch (error: any) {
      console.warn('[Scanner Overview] TP failed, using local fallback:', error?.message);
    }
  }

  // Local fallback: generate full scanner overview
  if (canGenerateLocalScanner()) {
    try {
      const overview = await generateLocalScannerOverview();
      const data = {
        success: true,
        data: overview,
        source: 'local-fallback',
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    } catch (error: any) {
      console.warn('[Scanner Overview] Local fallback failed:', error?.message);
    }
  }

  return NextResponse.json(
    { success: true, data: null, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=10' } }
  );
}
