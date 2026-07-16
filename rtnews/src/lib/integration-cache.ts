declare const __non_webpack_require__: any;
// ─── Integration Cache Layer V1 ────────────────────────────
// Provides a unified caching system for integration data.
// Supports optional Redis as primary cache with in-memory fallback.
//
// Usage:
//   const cache = getIntegrationCache();
//   await cache.set('signals:active', data, 30_000);
//   const data = await cache.get('signals:active');
//
// Environment:
//   REDIS_URL — If set, uses Redis as primary cache (e.g. redis://localhost:6379)
//   If not set, uses in-memory cache (survives hot reloads via globalThis).

// ─── Cache Entry ─────────────────────────────────────────────
interface CacheEntry {
  data: any;
  expiresAt: number;
  createdAt: number;
}

// ─── In-Memory Cache Store ──────────────────────────────────
// Uses globalThis to survive Next.js hot reloads in development.
const GLOBAL_CACHE_KEY = '__roua_integration_cache__';

function getGlobalStore(): Map<string, CacheEntry> {
  if (!(globalThis as any)[GLOBAL_CACHE_KEY]) {
    (globalThis as any)[GLOBAL_CACHE_KEY] = new Map<string, CacheEntry>();
  }
  return (globalThis as any)[GLOBAL_CACHE_KEY];
}

// ─── Cache Statistics ────────────────────────────────────────
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
  redisConnected: boolean;
}

const GLOBAL_STATS_KEY = '__roua_cache_stats__';

function getGlobalStats(): { hits: number; misses: number; sets: number; evictions: number } {
  if (!(globalThis as any)[GLOBAL_STATS_KEY]) {
    (globalThis as any)[GLOBAL_STATS_KEY] = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }
  return (globalThis as any)[GLOBAL_STATS_KEY];
}

// ─── Redis Client (lazy-loaded) ─────────────────────────────
let redisClient: any = null;
let redisConnected = false;
let redisAttempted = false;

async function getRedisClient(): Promise<any> {
  if (redisAttempted) return redisClient;
  redisAttempted = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    // Dynamic import — ioredis is optional and must be installed separately
    // Using eval('require') to prevent Turbopack/Webpack from trying to
    // resolve the optional module at build time (which causes build errors)
    let Redis: any;
    try {
      // Dynamic require — ioredis is an optional peer dependency.
      // Using Function constructor to avoid Turbopack/WP static analysis
      // which would try to bundle the missing module at build time.
      // ioredis is listed in serverExternalPackages in next.config.mjs
      // so the bundler won't attempt to resolve it.
      const dynamicRequire = typeof (typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : undefined as any) !== 'undefined'
        ? (typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : undefined as any)
        : typeof require !== 'undefined'
          ? require
          : Function('return require')();
      Redis = dynamicRequire('ioredis');
      if (Redis?.default) Redis = Redis.default;
    } catch {
      console.log('[Integration Cache] ioredis not installed — using in-memory cache');
      return null;
    }
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 1000, 5000);
      },
    });

    redisClient.on('error', (err: any) => {
      console.warn('[Integration Cache] Redis error:', err?.message);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Integration Cache] Redis connected');
      redisConnected = true;
    });

    await redisClient.connect();
    redisConnected = true;
    return redisClient;
  } catch (error: any) {
    console.warn('[Integration Cache] Redis unavailable, using in-memory cache:', error?.message);
    redisClient = null;
    return null;
  }
}

// ─── Cache Interface ─────────────────────────────────────────
export interface IntegrationCache {
  get(key: string): Promise<any | null>;
  set(key: string, data: any, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(prefix?: string): Promise<void>;
  getStats(): Promise<CacheStats>;
}

// ─── In-Memory Cache Implementation ─────────────────────────
class InMemoryCache implements IntegrationCache {
  private store: Map<string, CacheEntry>;

  constructor() {
    this.store = getGlobalStore();
    // Periodic cleanup every 2 minutes
    if (!(globalThis as any).__roua_cache_cleanup__) {
      (globalThis as any).__roua_cache_cleanup__ = true;
      setInterval(() => this.cleanup(), 2 * 60 * 1000);
    }
  }

  async get(key: string): Promise<any | null> {
    const stats = getGlobalStats();
    const entry = this.store.get(key);
    if (!entry) {
      stats.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      stats.misses++;
      stats.evictions++;
      return null;
    }
    stats.hits++;
    return entry.data;
  }

  async set(key: string, data: any, ttlMs: number): Promise<void> {
    const stats = getGlobalStats();
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
    stats.sets++;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(prefix?: string): Promise<void> {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async getStats(): Promise<CacheStats> {
    const stats = getGlobalStats();
    return {
      ...stats,
      size: this.store.size,
      redisConnected: false,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const stats = getGlobalStats();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        stats.evictions++;
      }
    }
  }
}

// ─── Redis-Backed Cache Implementation ──────────────────────
class RedisCache implements IntegrationCache {
  private redis: any;
  private localCache: InMemoryCache; // L1 cache for hot data

  constructor(redisClient: any) {
    this.redis = redisClient;
    this.localCache = new InMemoryCache();
  }

  async get(key: string): Promise<any | null> {
    // Check L1 (local) first
    const local = await this.localCache.get(key);
    if (local !== null) return local;

    // Check L2 (Redis)
    try {
      const raw = await this.redis.get(`roua:${key}`);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      // Store in L1 with short TTL for next request
      await this.localCache.set(key, parsed.data, Math.min(parsed.ttlMs || 10_000, 10_000));
      const stats = getGlobalStats();
      stats.hits++;
      return parsed.data;
    } catch (error: any) {
      console.warn('[Integration Cache] Redis get error:', error?.message);
      return this.localCache.get(key);
    }
  }

  async set(key: string, data: any, ttlMs: number): Promise<void> {
    // Set in both L1 and L2
    await this.localCache.set(key, data, ttlMs);

    try {
      await this.redis.set(
        `roua:${key}`,
        JSON.stringify({ data, ttlMs, createdAt: Date.now() }),
        'PX', ttlMs // Set TTL in milliseconds
      );
    } catch (error: any) {
      console.warn('[Integration Cache] Redis set error:', error?.message);
    }

    const stats = getGlobalStats();
    stats.sets++;
  }

  async delete(key: string): Promise<void> {
    await this.localCache.delete(key);
    try {
      await this.redis.del(`roua:${key}`);
    } catch {}
  }

  async clear(prefix?: string): Promise<void> {
    await this.localCache.clear(prefix);
    try {
      if (!prefix) {
        // Delete all roua: keys
        const keys = await this.redis.keys('roua:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        const keys = await this.redis.keys(`roua:${prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch {}
  }

  async getStats(): Promise<CacheStats> {
    const localStats = await this.localCache.getStats();
    return {
      ...localStats,
      redisConnected: redisConnected,
    };
  }
}

// ─── Singleton Cache Instance ───────────────────────────────
let cacheInstance: IntegrationCache | null = null;

/**
 * Get the integration cache instance.
 * Uses Redis if available, otherwise falls back to in-memory cache.
 * The instance is cached globally to survive hot reloads.
 */
export async function getIntegrationCache(): Promise<IntegrationCache> {
  if (cacheInstance) return cacheInstance;

  const redis = await getRedisClient();
  if (redis && redisConnected) {
    cacheInstance = new RedisCache(redis);
    console.log('[Integration Cache] Using Redis-backed cache');
  } else {
    cacheInstance = new InMemoryCache();
    console.log('[Integration Cache] Using in-memory cache');
  }

  return cacheInstance;
}

/**
 * Synchronous version — always returns in-memory cache.
 * Use this for simple cases where async initialization is not practical.
 * The async getIntegrationCache() is preferred for Redis support.
 */
export function getSyncCache(): IntegrationCache {
  if (!cacheInstance) {
    cacheInstance = new InMemoryCache();
  }
  return cacheInstance;
}

/**
 * Invalidate cache entries for a specific prefix.
 * Useful when data changes and cached values need to be refreshed.
 */
export async function invalidateCache(prefix: string): Promise<void> {
  const cache = await getIntegrationCache();
  await cache.clear(prefix);
}

// ─── Cache Key Helpers ──────────────────────────────────────
export const CacheKeys = {
  signals: (mode: string, params?: string) => `signals:${mode}${params ? `:${params}` : ''}`,
  chart: (symbol: string, interval: string, limit: string) => `chart:${symbol}:${interval}:${limit}`,
  quote: (symbol: string) => `quote:${symbol}`,
  sparkline: (symbol: string) => `sparkline:${symbol}`,
  quotes: () => 'quotes:batch',
  sparklines: () => 'sparklines:batch',
  news: (filters: string) => `news:${filters}`,
  reports: (filters: string) => `reports:${filters}`,
} as const;

// ─── Cache TTL Constants ────────────────────────────────────
export const CacheTTL = {
  QUOTES: 5 * 1000,         // 5 seconds — live prices
  CHART: 30 * 1000,         // 30 seconds — chart data
  SIGNALS: 30 * 1000,       // 30 seconds — trading signals
  SPARKLINE: 30 * 1000,     // 30 seconds — sparkline data
  NEWS: 60 * 1000,          // 60 seconds — news articles
  REPORTS: 120 * 1000,      // 120 seconds — reports (change infrequently)
  BATCH_QUOTES: 30 * 1000,  // 30 seconds — batch quotes
  BATCH_SPARKLINES: 60 * 1000, // 60 seconds — batch sparklines
} as const;
