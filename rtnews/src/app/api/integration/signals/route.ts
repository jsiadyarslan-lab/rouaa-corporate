// ─── Integration: Trading Signals V6 ────────────────────────
// Proxies trading signal data from the trading platform.
// Public API route — server-side fetches with integration auth.
//
// V6: DB-first strategy — loads from database before generating
//     new signals. This gives users instant history and stats
//     without waiting for API calls.
//
// Endpoints:
//   GET /api/integration/signals          → Active signals
//   GET /api/integration/signals?mode=history&limit=20  → Signal history
//   GET /api/integration/signals?mode=stats              → Signal stats

import { NextRequest, NextResponse } from 'next/server';
import { fetchFromTradingPlatform, authenticateIntegrationRequest } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';
import { generateLocalSignals, generateLocalSignalHistory, canGenerateLocalSignals, loadPersistedSignals, getPersistedSignalStats } from '@/lib/local-signals';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // V3: Unified auth — allows public access with rate limiting
  const { authenticated, rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'signals');
  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات. حاول لاحقاً.', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult?.retryAfterMs || 60000) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'active';
  const symbol = searchParams.get('symbol');
  const limit = searchParams.get('limit') || '20';

  try {
    switch (mode) {
      case 'active':
        return await handleActiveSignals(symbol, limit);
      case 'history':
        return await handleSignalHistory(limit);
      case 'stats':
        return await handleSignalStats();
      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[Signals Integration] mode=${mode} failed:`, error?.message);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات الإشارات', detail: error?.message },
      { status: 502 }
    );
  }
}

async function handleActiveSignals(symbol: string | null, limit: string) {
  const cache = getSyncCache();
  const cacheKey = CacheKeys.signals('active', `${symbol || 'all'}-${limit}`);

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }

  // V6: Try DB first — load persisted signals from database
  try {
    const dbSignals = await loadPersistedSignals({ status: 'ACTIVE', limit: parseInt(limit) });
    if (dbSignals.length > 0) {
      console.log(`[Signals V6] Loaded ${dbSignals.length} signals from DB`);
      const data = { signals: dbSignals, count: dbSignals.length, source: 'database' };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    }
  } catch (err: any) {
    console.warn('[Signals V6] DB load failed:', err?.message?.slice(0, 80));
  }

  // Try trading platform next
  try {
    let path = `/api/integration/signals?limit=${limit}`;
    if (symbol) {
      path += `&symbol=${encodeURIComponent(symbol)}`;
    }

    console.log(`[Signals V5] Fetching from trading platform: ${path}`);
    const response = await fetchFromTradingPlatform(path);
    console.log(`[Signals V5] TP response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      // Only use trading platform data if it has actual signals
      if (data.signals && Array.isArray(data.signals) && data.signals.length > 0) {
        console.log(`[Signals V5] Got ${data.signals.length} signals from trading platform`);
        await cache.set(cacheKey, data, CacheTTL.SIGNALS);
        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'public, max-age=30' },
        });
      } else {
        console.warn(`[Signals V5] TP returned OK but no signals in response:`, JSON.stringify(data).slice(0, 200));
      }
    }
  } catch (error: any) {
    console.warn('[Signals V5] Trading platform failed, trying local fallback:', error?.message);
  }

  // Fallback: Generate local signals from financial APIs
  const canLocal = canGenerateLocalSignals();
  console.log(`[Signals V5] canGenerateLocalSignals: ${canLocal}`);

  if (canLocal) {
    try {
      const { signals, stats } = await generateLocalSignals({
        includeWait: false,
        limit: parseInt(limit),
      });

      const data = {
        signals,
        count: signals.length,
        source: 'local-fallback',
        stats,
      };

      console.log(`[Signals V5] Generated ${signals.length} local signals`);
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, max-age=30' },
      });
    } catch (error: any) {
      console.warn('[Signals V5] Local fallback also failed:', error?.message);
    }
  }

  // No data available from any source
  console.warn('[Signals V5] All sources unavailable — returning empty');
  return NextResponse.json(
    { signals: [], count: 0, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=10' } }
  );
}

async function handleSignalHistory(limit: string) {
  const cache = getSyncCache();
  const cacheKey = CacheKeys.signals('history', limit);

  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });
  }

  // V6: Try DB first — load all signal history
  try {
    const dbSignals = await loadPersistedSignals({ status: 'ALL', limit: parseInt(limit) });
    if (dbSignals.length > 0) {
      const dbStats = await getPersistedSignalStats();
      const data = {
        signals: dbSignals,
        count: dbSignals.length,
        source: 'database',
        stats: dbStats || undefined,
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
    }
  } catch (err: any) {
    console.warn('[Signals History V6] DB load failed:', err?.message?.slice(0, 80));
  }

  // Try trading platform
  try {
    const response = await fetchFromTradingPlatform(
      `/api/integration/signals/history?limit=${limit}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.signals && Array.isArray(data.signals) && data.signals.length > 0) {
        await cache.set(cacheKey, data, CacheTTL.SIGNALS);
        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'public, max-age=60' },
        });
      }
    }
  } catch (error: any) {
    console.warn('[Signals History] Trading platform failed, trying local fallback:', error?.message);
  }

  // Fallback: Generate local signal history
  if (canGenerateLocalSignals()) {
    try {
      const { signals, stats } = await generateLocalSignalHistory(parseInt(limit));

      const data = {
        signals,
        count: signals.length,
        source: 'local-fallback',
        stats,
      };

      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    } catch (error: any) {
      console.warn('[Signals History] Local fallback also failed:', error?.message);
    }
  }

  return NextResponse.json(
    { signals: [], count: 0, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=30' } }
  );
}

async function handleSignalStats() {
  const cache = getSyncCache();
  const cacheKey = CacheKeys.signals('stats');

  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });
  }

  // V6: Try DB first for stats
  try {
    const dbStats = await getPersistedSignalStats();
    if (dbStats && dbStats.total > 0) {
      await cache.set(cacheKey, dbStats, CacheTTL.SIGNALS);
      return NextResponse.json(dbStats, { headers: { 'Cache-Control': 'public, max-age=60' } });
    }
  } catch (err: any) {
    console.warn('[Signals Stats V6] DB stats failed:', err?.message?.slice(0, 80));
  }

  // Try trading platform first
  try {
    const response = await fetchFromTradingPlatform(
      `/api/integration/signals/stats`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.total !== undefined) {
        await cache.set(cacheKey, data, CacheTTL.SIGNALS);
        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'public, max-age=60' },
        });
      }
    }
  } catch (error: any) {
    console.warn('[Signals Stats] Trading platform failed, trying local fallback:', error?.message);
  }

  // Fallback: Generate stats from local signals
  if (canGenerateLocalSignals()) {
    try {
      const { stats } = await generateLocalSignals({ includeWait: false, limit: 10 });
      const data = {
        ...stats,
        source: 'local-fallback',
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    } catch (error: any) {
      console.warn('[Signals Stats] Local fallback also failed:', error?.message);
    }
  }

  return NextResponse.json(
    { total: 0, active: 0, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=30' } }
  );
}
