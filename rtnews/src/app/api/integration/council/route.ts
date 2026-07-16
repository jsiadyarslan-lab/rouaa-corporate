// ─── Integration: Strategic Council Proxy V2 ────────────────────
// Proxies Strategic Council (المجلس الذكي) data from the trading platform.
// The council is @Public() on the trading platform (no API key needed).
//
// V2: Added local fallback when trading platform council is unavailable.
//     Converts local trading signals into council brief format with
//     8-model consensus derived from signal analysis.
//
// Endpoints proxied:
//   GET /api/integration/council?mode=briefs           → All active briefs + count
//   GET /api/integration/council?mode=active&symbol=X  → Active briefs (filterable)
//   GET /api/integration/council?mode=history          → Brief history
//   GET /api/integration/council?mode=count            → Active briefs count
//   GET /api/integration/council?mode=session-status   → Is session running?
//   GET /api/integration/council?mode=last-session     → Last session result

import { NextRequest, NextResponse } from 'next/server';
import { fetchFromTradingPlatform, authenticateIntegrationRequest, isCircuitClosed } from '@/lib/integration-auth';
import { getSyncCache, CacheTTL } from '@/lib/integration-cache';
import { generateLocalCouncilBriefs, generateLocalCouncilCount, canGenerateLocalCouncil, loadPersistedCouncilBriefs } from '@/lib/local-council';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { rateLimited } = authenticateIntegrationRequest(request, 'signals');
  if (rateLimited) {
    return NextResponse.json({ error: 'تم تجاوز حد الطلبات' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'briefs';
  const symbol = searchParams.get('symbol');

  const cache = getSyncCache();

  try {
    switch (mode) {
      case 'briefs':
        return await handleBriefs(cache, symbol);
      case 'active':
        return await handleActiveBriefs(cache, symbol);
      case 'history':
        return await handleHistory(cache);
      case 'count':
        return await handleCount(cache);
      case 'session-status':
        return await handleSessionStatus(cache);
      case 'last-session':
        return await handleLastSession(cache);
      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[Council Proxy] mode=${mode} failed:`, error?.message);
    return NextResponse.json({ error: 'فشل في جلب بيانات المجلس الذكي' }, { status: 502 });
  }
}

async function handleBriefs(cache: any, symbol: string | null) {
  const cacheKey = `council:briefs:${symbol || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      let path = '/api/strategic-council/briefs';
      const response = await fetchFromTradingPlatform(path);
      if (response.ok) {
        const data = await response.json();
        if (data && (data.active?.length > 0 || data.data?.active?.length > 0 || data.count > 0)) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
        }
      }
    } catch (error: any) {
      console.warn('[Council Briefs] TP failed, using local fallback:', error?.message);
    }
  }

  // V2: Try DB first for council briefs
  try {
    const dbBriefs = await loadPersistedCouncilBriefs();
    if (dbBriefs.length > 0) {
      let filteredActive = dbBriefs;
      if (symbol) {
        const normalized = symbol.replace(/-/g, '/');
        filteredActive = dbBriefs.filter(b =>
          b.pair.toLowerCase().includes(normalized.toLowerCase())
        );
      }
      const data = {
        success: true,
        data: {
          active: filteredActive,
          count: filteredActive.length,
          lastSessionAt: new Date().toISOString(),
          isRunning: false,
        },
        source: 'database',
      };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    }
  } catch (err: any) {
    console.warn('[Council Briefs V2] DB load failed:', err?.message?.slice(0, 80));
  }

  // Local fallback: generate council briefs from local signals
  if (canGenerateLocalCouncil()) {
    try {
      const councilData = await generateLocalCouncilBriefs();

      // Filter by symbol if specified
      let filteredActive = councilData.active;
      if (symbol) {
        const normalized = symbol.replace(/-/g, '/');
        filteredActive = councilData.active.filter(b =>
          b.pair.toLowerCase().includes(normalized.toLowerCase())
        );
      }

      const data = {
        success: true,
        data: {
          active: filteredActive,
          count: filteredActive.length,
          lastSessionAt: councilData.lastSessionAt,
          isRunning: councilData.isRunning,
        },
        source: 'local-fallback',
      };

      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    } catch (error: any) {
      console.warn('[Council Briefs] Local fallback failed:', error?.message);
    }
  }

  // No data from any source
  return NextResponse.json(
    { success: true, data: { active: [], count: 0 }, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=10' } }
  );
}

async function handleActiveBriefs(cache: any, symbol: string | null) {
  const cacheKey = `council:active:${symbol || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      let path = '/api/strategic-council/briefs/active';
      if (symbol) {
        const normalized = symbol.replace(/-/g, '/');
        path += `?symbol=${encodeURIComponent(normalized)}`;
      }
      const response = await fetchFromTradingPlatform(path);
      if (response.ok) {
        const data = await response.json();
        if (data && (data.active?.length > 0 || data.data?.length > 0 || data.count > 0)) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
        }
      }
    } catch (error: any) {
      console.warn('[Council Active] TP failed, using local fallback:', error?.message);
    }
  }

  // Local fallback
  if (canGenerateLocalCouncil()) {
    try {
      const councilData = await generateLocalCouncilBriefs();

      let filteredActive = councilData.active;
      if (symbol) {
        const normalized = symbol.replace(/-/g, '/');
        filteredActive = councilData.active.filter(b =>
          b.pair.toLowerCase().includes(normalized.toLowerCase())
        );
      }

      const data = {
        success: true,
        data: filteredActive,
        count: filteredActive.length,
        source: 'local-fallback',
      };

      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    } catch (error: any) {
      console.warn('[Council Active] Local fallback failed:', error?.message);
    }
  }

  return NextResponse.json(
    { success: true, data: [], count: 0, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=10' } }
  );
}

async function handleHistory(cache: any) {
  const cacheKey = 'council:history';
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform('/api/strategic-council/briefs/history');
      if (response.ok) {
        const data = await response.json();
        if (data && (data.history?.length > 0 || data.data?.length > 0)) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
        }
      }
    } catch (error: any) {
      console.warn('[Council History] TP failed:', error?.message);
    }
  }

  // No local fallback for history — return empty
  return NextResponse.json(
    { success: true, data: [], count: 0, source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  );
}

async function handleCount(cache: any) {
  const cacheKey = 'council:count';
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform('/api/strategic-council/briefs/count');
      if (response.ok) {
        const data = await response.json();
        if (data && data.count !== undefined) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
        }
      }
    } catch (error: any) {
      console.warn('[Council Count] TP failed:', error?.message);
    }
  }

  // Local fallback
  if (canGenerateLocalCouncil()) {
    try {
      const count = await generateLocalCouncilCount();
      const data = { count, source: 'local-fallback' };
      await cache.set(cacheKey, data, CacheTTL.SIGNALS);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ count: 0, source: 'unavailable' });
}

async function handleSessionStatus(cache: any) {
  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform('/api/strategic-council/session/status');
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { headers: { 'Cache-Control': 'no-cache' } });
      }
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ isRunning: false, source: 'local-fallback' });
}

async function handleLastSession(cache: any) {
  const cacheKey = 'council:last-session';
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });

  // Try trading platform first
  if (isCircuitClosed()) {
    try {
      const response = await fetchFromTradingPlatform('/api/strategic-council/session/last');
      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false) {
          await cache.set(cacheKey, data, CacheTTL.SIGNALS);
          return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } });
        }
      }
    } catch (error: any) {
      console.warn('[Council Last Session] TP failed:', error?.message);
    }
  }

  // Local fallback
  return NextResponse.json({
    success: true,
    data: {
      completedAt: new Date().toISOString(),
      briefsGenerated: 0,
      status: 'fallback',
    },
    source: 'local-fallback',
  });
}
