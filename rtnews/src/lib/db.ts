// ─── Database Connection — Sustainable Architecture ──────────
// Works with BOTH Supabase connection types automatically:
//   - Direct connection (port 5432) → Full Prisma features
//   - Pooler/PgBouncer (port 6543) → Auto-adds pgbouncer=true
//
// Key principles:
//   1. Auto-detect connection type from URL port
//   2. Never fail silently — always log clear diagnostics
//   3. No pg_terminate_backend — it kills Prisma's own pool connections
//   4. Single PrismaClient instance (singleton) — no pool exhaustion from duplicates
//   5. Health check function for /api/db-health endpoint

import { PrismaClient } from '@prisma/client'

// ── Singleton pattern ──
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ── Connection URL builder ──
// Automatically configures the connection based on the port:
//   - Port 5432 (Direct): Full Prisma support, conservative connection limit
//   - Port 6543 (Pooler): Adds pgbouncer=true, higher connection limit (PgBouncer multiplexes)
//   - Any other port: Treated as direct
function buildConnectionUrl(rawUrl: string): { url: string; mode: 'direct' | 'pooler' | 'dummy'; port: string } {
  if (!rawUrl || rawUrl.includes('dummy')) {
    return { url: rawUrl, mode: 'dummy', port: 'none' }
  }

  // Don't modify if already fully configured (has connection_limit AND pgbouncer if needed)
  if (rawUrl.includes('connection_limit')) {
    const port = rawUrl.match(/:(\d+)\//)?.[1] || 'unknown'
    const isPooler = port === '6543'
    return { url: rawUrl, mode: isPooler ? 'pooler' : 'direct', port }
  }

  const port = rawUrl.match(/:(\d+)\//)?.[1] || '5432'
  const isPooler = port === '6543'
  const separator = rawUrl.includes('?') ? '&' : '?'

  let url = rawUrl

  // Connection parameters
  const connectionLimit = isPooler ? 10 : 7  // Pooler multiplexes, so higher limit is fine
  const poolTimeout = 10    // Fail fast instead of hanging 60s
  const connectTimeout = 10 // 10s connect timeout

  url += `${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`

  // CRITICAL: When using PgBouncer (Supabase pooler port 6543),
  // Prisma MUST use pgbouncer=true because PgBouncer uses transaction-mode
  // pooling which is incompatible with Prisma's prepared statements.
  if (isPooler && !url.includes('pgbouncer=true')) {
    url += '&pgbouncer=true'
  }

  return { url, mode: isPooler ? 'pooler' : 'direct', port }
}

// ── Mask password for logging ──
function maskUrl(url: string): string {
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')
}

// ── Create PrismaClient ──
function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL || ''
  const { url: effectiveUrl, mode, port } = buildConnectionUrl(rawUrl)

  // Log clear diagnostics on startup
  if (mode === 'dummy') {
    console.warn('[DB] ⚠️ DATABASE_URL not set — all database queries will fail')
    console.warn('[DB] Set DATABASE_URL in your deployment platform (Railway/Supabase)')
  } else {
    console.log(`[DB] Connection mode: ${mode} (port ${port})`)
    console.log(`[DB] URL: ${maskUrl(effectiveUrl)}`)
    if (mode === 'pooler') {
      console.log('[DB] PgBouncer mode enabled — pgbouncer=true auto-added')
    }
  }

  try {
    return new PrismaClient({
      datasourceUrl: effectiveUrl || 'postgresql://dummy:dummy@localhost:5432/dummy',
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (err: any) {
    console.error('[DB] ✗ Failed to initialize PrismaClient:', err.message)
    console.error('[DB] Check your DATABASE_URL — it may be malformed')
    // Return a dummy client that will fail loudly on queries
    // rather than crashing the entire server startup
    return new PrismaClient({
      datasourceUrl: 'postgresql://dummy:dummy@localhost:5432/dummy',
      log: ['error'],
    })
  }
}

// ── Initialize singleton ──
const rawClient = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = rawClient

// ── Prisma Client Extension — Publish Guard ──
// Once an article is published (isReady=true), it can NEVER be unpublished.
const db = rawClient.$extends({
  name: 'publishGuard',
  query: {
    newsItem: {
      async update({ args, query }) {
        const newData = args.data as any
        if (newData?.isReady === false || newData?.isPublished === false) {
          try {
            const current = await rawClient.newsItem.findUnique({
              where: args.where as any,
              select: { isReady: true, isPublished: true, id: true, titleAr: true },
            })
            if (current && (current.isReady || current.isPublished)) {
              console.error(
                `[DB GUARD] BLOCKED attempt to un-publish article: ` +
                `id="${current.id}" title="${(current.titleAr || '').slice(0, 50)}"`
              )
              if (newData.isReady === false) delete newData.isReady
              if (newData.isPublished === false) delete newData.isPublished
            }
          } catch {
            // If we can't check, allow the update (fail-open)
          }
        }
        return query(args)
      },

      async updateMany({ args, query }) {
        const newData = args.data as any
        if (newData?.isReady === false || newData?.isPublished === false) {
          const existingWhere = args.where as any || {}
          const guardWhere: any = { ...existingWhere, isReady: false }
          if (newData.isPublished === false && !existingWhere.isPublished) {
            guardWhere.isPublished = false
          }
          args.where = guardWhere
          if (newData.isReady === false) delete newData.isReady
          if (newData.isPublished === false) delete newData.isPublished
        }
        return query(args)
      },
    },
  },
})

// ── Health check — tests if DB is actually reachable ──
export async function checkDBHealth(): Promise<{
  connected: boolean
  mode: 'direct' | 'pooler' | 'dummy'
  port: string
  latencyMs: number
  error?: string
  url?: string  // masked
}> {
  const rawUrl = process.env.DATABASE_URL || ''
  const { mode, port } = buildConnectionUrl(rawUrl)

  if (mode === 'dummy') {
    return {
      connected: false,
      mode: 'dummy',
      port: 'none',
      latencyMs: 0,
      error: 'DATABASE_URL not set',
    }
  }

  const start = Date.now()
  try {
    await rawClient.$queryRaw`SELECT 1`
    return {
      connected: true,
      mode,
      port,
      latencyMs: Date.now() - start,
      url: maskUrl(rawUrl),
    }
  } catch (err: any) {
    return {
      connected: false,
      mode,
      port,
      latencyMs: Date.now() - start,
      error: err.message?.slice(0, 200),
      url: maskUrl(rawUrl),
    }
  }
}

// ── Quick DB ping ──
export async function pingDB(): Promise<boolean> {
  try {
    await rawClient.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

// ── Connection recovery — used by pipeline orchestrators ──
// Simply disconnects and reconnects Prisma.
// Does NOT call pg_terminate_backend (which kills Prisma's own pool connections).
let isRecovering = false;

export async function recoverConnection(): Promise<boolean> {
  if (isRecovering) {
    // Wait for the ongoing recovery to finish
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (!isRecovering) break;
    }
    return pingDB();
  }

  isRecovering = true;
  console.log('[DB] Attempting connection recovery...');

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await rawClient.$disconnect();
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

      const ok = await pingDB();
      if (ok) {
        console.log(`[DB] ✓ Connection recovered (attempt ${attempt})`);
        isRecovering = false;
        return true;
      }
      console.warn(`[DB] Recovery verification failed (attempt ${attempt}/3)`);
    } catch (err: any) {
      console.error(`[DB] Recovery attempt ${attempt} failed: ${err.message?.slice(0, 100)}`);
    }
  }

  isRecovering = false;
  console.error('[DB] ✗ All recovery attempts failed');
  return false;
}

// ── Keepalive — prevents Supabase from dropping idle connections ──
// IMPORTANT: This ONLY pings. It does NOT kill any connections.
// pg_terminate_backend was removed because it kills Prisma's own pool
// connections, causing the recurring "DB: Disconnected" issue.
let keepaliveTimer: ReturnType<typeof setInterval> | null = null
const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function startDBKeepalive(): void {
  if (keepaliveTimer) return
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return

  console.log('[DB] Starting keepalive ping (every 5 minutes)')
  keepaliveTimer = setInterval(async () => {
    try {
      const ok = await pingDB()
      if (!ok) {
        console.warn('[DB Keepalive] Ping failed — will retry on next interval')
      }
    } catch (err: any) {
      console.warn(`[DB Keepalive] Error: ${err.message?.slice(0, 80)}`)
    }
  }, KEEPALIVE_INTERVAL_MS)

  // Initial ping
  pingDB().then(ok => {
    if (ok) {
      console.log('[DB] ✓ Initial connection test passed')
    } else {
      console.warn('[DB] ✗ Initial connection test failed — check DATABASE_URL')
    }
  }).catch(() => {})
}

// ── Safe DB query wrapper — auto-retries on transient connection errors ──
export async function safeDBQuery<T>(
  operation: () => Promise<T>,
  label: string = 'DB operation'
): Promise<T | null> {
  const MAX_ATTEMPTS = 2

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await operation()
    } catch (err: any) {
      const errMsg = err.message || ''
      const isConnectionError =
        errMsg.includes('too many clients') ||
        errMsg.includes('connection') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('ECONNREFUSED') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('P1001') ||
        errMsg.includes('P1002') ||
        errMsg.includes('P1008') ||
        errMsg.includes('P1011') ||
        errMsg.includes('P1017')

      if (isConnectionError && attempt < MAX_ATTEMPTS) {
        console.warn(`[DB] ${label} failed (attempt ${attempt}): ${errMsg.slice(0, 80)} — retrying...`)
        // Disconnect and reconnect
        try { await rawClient.$disconnect() } catch {}
        await new Promise(r => setTimeout(r, 2000))
      } else {
        throw err
      }
    }
  }
  return null
}

export { db, rawClient }
