/// <reference types="node" />

// ─── Server Startup ──────────────────────────────────────────
// Runs once when Next.js server starts.
//
// Architecture:
//   1. Test DB connection + log diagnostics
//   2. Verify DB schema (create tables if missing)
//   3. Start DB keepalive
//   4. Start pipeline orchestrator (retry forever)
//   5. Start locale-specific pipelines (staggered)
//   6. Trigger bootstrap for initial news fill
//
// CRITICAL: Never call pg_terminate_backend from this code.
// It kills Prisma's own pool connections, causing recurring
// "DB: Disconnected" errors.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Startup] Server starting...');

    // ── 0. Validate Google OAuth env vars ──
    (() => {
      const rawId = process.env.GOOGLE_CLIENT_ID;
      const rawSecret = process.env.GOOGLE_CLIENT_SECRET;
      const id = rawId?.trim();
      const secret = rawSecret?.trim();

      if (!id) {
        console.warn('[NextAuth] GOOGLE_CLIENT_ID not set — Google login will fail');
      } else {
        const idValid = id.endsWith('.apps.googleusercontent.com') && id.length > 30;
        if (!idValid) console.warn('[NextAuth] ⚠️ GOOGLE_CLIENT_ID format looks wrong');
        if (rawId !== id) console.warn('[NextAuth] ⚠️ GOOGLE_CLIENT_ID had whitespace — trimmed');
      }

      if (!secret) {
        console.warn('[NextAuth] GOOGLE_CLIENT_SECRET not set — Google login will fail');
      } else {
        const secretValid = secret.startsWith('GOCSPX-') && secret.length >= 30;
        if (!secretValid) console.warn('[NextAuth] ⚠️ GOOGLE_CLIENT_SECRET format looks wrong');
        if (rawSecret !== secret) console.warn('[NextAuth] ⚠️ GOOGLE_CLIENT_SECRET had whitespace — trimmed');
      }

      const nextauthSecret = (process.env.NEXTAUTH_SECRET || process.env.ADMIN_SECRET)?.trim();
      if (!nextauthSecret) {
        console.warn('[NextAuth] NEXTAUTH_SECRET not set — JWT signing may be insecure');
      }
    })();

    // ── 1. Test DB connection + initialize schema ──
    (async () => {
      try {
        if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
          console.warn('[Startup] ⚠️ DATABASE_URL not set — skipping DB initialization');
          console.warn('[Startup] The site will not work without a database connection.');
          console.warn('[Startup] Set DATABASE_URL in your deployment platform (Railway > Variables).');
          return;
        }

        // Test connection with diagnostics
        const { checkDBHealth } = await import('@/lib/db');
        const health = await checkDBHealth();

        if (health.connected) {
          console.log(`[Startup] ✓ DB connected — mode: ${health.mode}, port: ${health.port}, latency: ${health.latencyMs}ms`);
        } else {
          console.error(`[Startup] ✗ DB connection FAILED — mode: ${health.mode}, port: ${health.port}`);
          console.error(`[Startup] Error: ${health.error}`);
          if (health.mode === 'pooler') {
            console.error('[Startup] HINT: You are using PgBouncer (port 6543). Try switching to direct connection (port 5432) in DATABASE_URL.');
          } else if (health.mode === 'direct') {
            console.error('[Startup] HINT: Direct connection (port 5432) failed. Check your password and Supabase project settings.');
          }
          // Don't return — continue startup. The keepalive will retry.
        }

        // Verify schema
        const { ensureDBSchema, ensureGeopoliticalTables } = await import('@/lib/db-init');
        await ensureDBSchema();
        console.log('[Startup] ✓ DB schema verified');

        // V1052: Ensure geopolitical tables exist (not in original migrations)
        try {
          await ensureGeopoliticalTables();
          console.log('[Startup] ✓ Geopolitical tables verified');
        } catch (geoErr: any) {
          console.warn(`[Startup] Geopolitical table init failed (non-critical): ${geoErr.message}`);
        }

        // Start keepalive
        try {
          const { startDBKeepalive } = await import('@/lib/db');
          startDBKeepalive();
        } catch (keepaliveErr: any) {
          console.warn(`[Startup] DB keepalive start failed (non-critical): ${keepaliveErr.message}`);
        }

        // Auto-seed agent API key
        try {
          const { db } = await import('@/lib/db');
          const crypto = await import('crypto');
          const KEY_NAME = 'ROUA Agents Bridge Key';
          const existing = await db.apiKey.findFirst({ where: { name: KEY_NAME, isActive: true } });
          if (!existing) {
            const key = `rva_${crypto.randomBytes(24).toString('hex')}`;
            await db.apiKey.create({
              data: { key, name: KEY_NAME, plan: 'enterprise', rateLimit: 10000, userId: null },
            });
            console.log(`[Startup] ✓ Agent API key created: ${key.slice(0, 12)}...`);
          }
        } catch { /* non-critical */ }
      } catch (err: any) {
        console.warn('[Startup] DB init failed (non-critical):', err?.message?.slice(0, 100));
      }
    })();

    // ── 2. Eagerly initialize AI providers ──
    (async () => {
      try {
        const { chatCompletion } = await import('@/lib/ai-provider');
        console.log('[Startup] Pre-initializing AI providers...');
        try {
          const testResult = await chatCompletion(
            [
              { role: 'system', content: 'Say OK' },
              { role: 'user', content: 'test' },
            ],
            { temperature: 0, maxTokens: 5, maxRetries: 0 }
          );
          console.log(`[Startup] ✓ AI provider initialized: ${testResult.provider} (${testResult.duration}ms)`);
        } catch (testErr: any) {
          console.warn(`[Startup] AI provider init test failed: ${testErr.message}`);
          console.warn('[Startup] Pipeline will use lazy init + structural fallback');
        }

        try {
          const { getProviderStatus } = await import('@/lib/ai-provider');
          const status = getProviderStatus();
          const available = status.filter((p: any) => p.available).map((p: any) => p.provider);
          console.log(`[Startup] AI providers available: [${available.join(', ')}]`);
        } catch {}
      } catch (err: any) {
        console.warn(`[Startup] AI provider eager init failed (non-critical): ${err.message}`);
      }
    })();

    // ── 3. Start Arabic Pipeline Orchestrator — NEVER GIVES UP ──
    (async () => {
      const MAX_BACKOFF_MS = 10 * 60 * 1000;
      const BASE_DELAY_MS = 15_000;
      let attempt = 0;

      while (true) {
        attempt++;
        try {
          const { startOrchestrator } = await import('@/lib/pipeline/orchestrator');
          startOrchestrator();
          console.log(`[Startup] ✓ Arabic Pipeline started (attempt ${attempt})`);
          // Pre-warm category image cache
          try {
            const { prewarmCategoryImageCache } = await import('@/lib/pipeline/agents/imager');
            prewarmCategoryImageCache().catch(() => {});
          } catch {}
          break;
        } catch (err: any) {
          const backoffMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
          console.error(`[Startup] Arabic Pipeline start failed (attempt ${attempt}): ${err.message}`);
          console.warn(`[Startup] Retrying in ${Math.round(backoffMs / 1000)}s...`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    })();

    // ── 4. Start Report Scheduler (Arabic) ──
    (async () => {
      try {
        const { startReportScheduler } = await import('@/lib/report-scheduler');
        startReportScheduler();
        console.log('[Startup] ✓ Report Scheduler (Arabic) started');
      } catch (err: any) {
        console.warn(`[Startup] Report Scheduler (Arabic) start failed (non-critical): ${err.message}`);
      }
    })();

    // ── 4b. Start Multi-Language Report Scheduler (EN/TR/FR/ES) ──
    (async () => {
      try {
        const { startMultilangReportScheduler } = await import('@/lib/multilang-report-scheduler');
        startMultilangReportScheduler();
        console.log('[Startup] ✓ Multi-Language Report Scheduler (EN/TR/FR/ES) started');
      } catch (err: any) {
        console.warn(`[Startup] Multi-Language Report Scheduler start failed (non-critical): ${err.message}`);
      }
    })();

    // ── 4c. Start Geopolitical Risk Scheduler (all 5 locales, every 12h) ──
    (async () => {
      try {
        const { startGeopoliticalScheduler } = await import('@/lib/pipeline/geopolitical-scheduler');
        startGeopoliticalScheduler();
        console.log('[Startup] ✓ Geopolitical Risk Scheduler (12h cycle, 5 locales) started');
      } catch (err: any) {
        console.warn(`[Startup] Geopolitical Risk Scheduler start failed (non-critical): ${err.message}`);
      }
    })();

    // ── 5. Trigger bootstrap for initial news fill ──
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      await new Promise(resolve => setTimeout(resolve, 45_000));

      try {
        const port = process.env.PORT || 8080;
        const bootstrapUrl = process.env.RAILWAY_PRIVATE_DOMAIN
          ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}/api/news/bootstrap?force=true`
          : `http://localhost:${port}/api/news/bootstrap?force=true`;

        const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '';
        const res = await fetch(bootstrapUrl, {
          signal: AbortSignal.timeout(30_000),
          headers: { 'x-internal': internalSecret },
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          console.log(`[Startup] ✓ Bootstrap completed:`, JSON.stringify({
            live: data?.results?.live,
            breaking: data?.results?.breaking,
            duration: data?.duration,
          }));
        } else {
          console.warn(`[Startup] Bootstrap returned status ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[Startup] Bootstrap trigger failed (non-critical): ${err.message}`);
      }
    })();

    // ── 6. Start English Pipeline (60s delay) ──
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      const MAX_BACKOFF_MS = 10 * 60 * 1000;
      const BASE_DELAY_MS = 15_000;
      let attempt = 0;

      await new Promise(r => setTimeout(r, 60_000));

      while (true) {
        attempt++;
        try {
          const { startEnOrchestrator } = await import('@/lib/pipeline/en-orchestrator');
          startEnOrchestrator();
          console.log(`[Startup] ✓ English Pipeline started (attempt ${attempt})`);
          break;
        } catch (err: any) {
          const backoffMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
          console.error(`[Startup] English Pipeline start failed (attempt ${attempt}): ${err.message}`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    })();

    // ── 7. Start French Pipeline (120s delay) ──
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      const MAX_BACKOFF_MS = 10 * 60 * 1000;
      const BASE_DELAY_MS = 15_000;
      let attempt = 0;

      await new Promise(r => setTimeout(r, 120_000));

      while (true) {
        attempt++;
        try {
          const { startFrOrchestrator } = await import('@/lib/pipeline/fr-orchestrator');
          startFrOrchestrator();
          console.log(`[Startup] ✓ French Pipeline started (attempt ${attempt})`);
          break;
        } catch (err: any) {
          const backoffMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
          console.error(`[Startup] French Pipeline start failed (attempt ${attempt}): ${err.message}`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    })();

    // ── 8. Start Turkish Pipeline (180s delay) ──
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      const MAX_BACKOFF_MS = 5 * 60 * 1000;
      const BASE_DELAY_MS = 15_000;
      let attempt = 0;

      await new Promise(r => setTimeout(r, 180_000));

      while (true) {
        attempt++;
        try {
          const { startTrOrchestrator } = await import('@/lib/pipeline/tr-orchestrator');
          startTrOrchestrator();
          console.log(`[Startup] ✓ Turkish Pipeline started (attempt ${attempt})`);
          break;
        } catch (err: any) {
          const backoffMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
          console.error(`[Startup] Turkish Pipeline start failed (attempt ${attempt}): ${err.message}`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    })();

    // ── 9. Start Stock Pipeline (90s delay) ──
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      const MAX_BACKOFF_MS = 10 * 60 * 1000;
      const BASE_DELAY_MS = 15_000;
      let attempt = 0;

      await new Promise(r => setTimeout(r, 90_000));

      while (true) {
        attempt++;
        try {
          const { startStockOrchestrator } = await import('@/lib/pipeline/stock-orchestrator');
          startStockOrchestrator();
          console.log(`[Startup] ✓ Stock Pipeline started (attempt ${attempt})`);
          break;
        } catch (err: any) {
          const backoffMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
          console.error(`[Startup] Stock Pipeline start failed (attempt ${attempt}): ${err.message}`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    })();

    // ── 10. Start Spanish Pipeline (210s delay) ──
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      const MAX_BACKOFF_MS = 5 * 60 * 1000;
      const BASE_DELAY_MS = 15_000;
      let attempt = 0;

      await new Promise(r => setTimeout(r, 210_000));

      while (true) {
        attempt++;
        try {
          const { startEsOrchestrator } = await import('@/lib/pipeline/es-orchestrator');
          startEsOrchestrator();
          console.log(`[Startup] ✓ Spanish Pipeline started (attempt ${attempt})`);
          break;
        } catch (err: any) {
          const backoffMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
          console.error(`[Startup] Spanish Pipeline start failed (attempt ${attempt}): ${err.message}`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    })();

    // ── 11. Start Agency Service (300s delay, self-triggering every 10 min) ──
    // V1120: Agency self-triggers via setInterval — doesn't depend on Railway cron.
    // The interval fires every 10 min, calling runAgencyCycle() directly.
    // This is the SAME pattern used by the Arabic/EN/FR/TR/ES pipelines.
    (async () => {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return;

      await new Promise(r => setTimeout(r, 300_000)); // 5 min delay

      const AGENCY_INTERVAL_MS = 10 * 60 * 1000; // 10 min
      let agencyRunning = false;

      const triggerAgency = async () => {
        if (agencyRunning) {
          console.log('[Agency] Cycle already running — skipping');
          return;
        }
        agencyRunning = true;
        try {
          const { runAgencyCycle } = await import('@/../services/news-agency/lib/orchestrator');
          const since = new Date(Date.now() - 168 * 60 * 60 * 1000); // V1127: 72h window (official sources publish 1-3x/week)
          console.log('[Agency] Self-triggered cycle starting...');
          const result = await runAgencyCycle(since);
          console.log(`[Agency] ✓ Cycle done: ${result.published} published, ${result.failed} failed, ${result.durationMs}ms`);
        } catch (err: any) {
          console.error(`[Agency] Cycle error: ${err.message?.slice(0, 200)}`);
        } finally {
          agencyRunning = false;
        }
      };

      // Trigger immediately on start
      triggerAgency();

      // Then every 10 min
      setInterval(triggerAgency, AGENCY_INTERVAL_MS);
      console.log('[Startup] ✓ Agency Service started (self-triggering every 10 min)');
    })();

    console.log('[Startup] ✓ All services initialized — AR + EN + FR + TR + ES + Stock + Agency pipelines running');
    console.log('[Startup] ✓ V1131+V1132 ACTIVE — publisher hash defense + financial filter + entity validation');
  }
}
