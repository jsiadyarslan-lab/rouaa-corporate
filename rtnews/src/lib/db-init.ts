// ─── Database Initialization ──────────────────────────────
// Automatically creates ALL tables on server startup.
// This ensures tables exist even on fresh deployments.
// Uses raw SQL for maximum reliability (no prisma db push dependency).

import { db } from '@/lib/db';

let initialized = false;
let initPromise: Promise<void> | null = null;
let lastVerifiedAt = 0;
const VERIFY_INTERVAL_MS = 10 * 60 * 1000; // Re-verify every 10 minutes (reduced from 2min to save connections)

// Force reset — call when DB tables are missing despite initialized=true
export function forceResetInit(): void {
  initialized = false;
  initPromise = null;
  lastVerifiedAt = 0;
  console.log('[DB Init] Force reset — will re-verify tables on next call');
}

export async function ensureDBSchema(): Promise<void> {
  // V2: Periodically re-verify even if initialized (catches DB resets)
  if (initialized && Date.now() - lastVerifiedAt < VERIFY_INTERVAL_MS) return;
  if (initialized && Date.now() - lastVerifiedAt >= VERIFY_INTERVAL_MS) {
    // Re-verify tables exist
    try {
      await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
      lastVerifiedAt = Date.now();
      return;
    } catch {
      console.warn('[DB Init] Tables missing despite initialized=true! Re-creating...');
      initialized = false;
      initPromise = null;
    }
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Skip if DATABASE_URL is not configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      console.log('[DB Init] Skipping - DATABASE_URL not configured');
      return;
    }

    // Strategy 1: Check if table already exists
    try {
      await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
      // CRITICAL FIX: Table exists BUT we must ALWAYS ensure site_settings exists too.
      // Previously we returned here, skipping site_settings creation if news_items existed.
      // This caused site_settings to be missing on upgrades, breaking the lock system.
      console.log('[DB Init] news_items exists. Ensuring site_settings, V61/V62 tables, and all columns...');
      await ensureSiteSettingsTable();
      await ensureAdsTable();
      await ensureV61Tables();
      await ensureV62Tables();
      await ensureV118Tables();
      await ensureInfographicsTable();
      await ensureV150Tables();
      await ensureVideoReportsTable(); // V318: Video reports table for interactive video player
      await ensureCouncilBriefsTable(); // V5: Council briefs table (was missing — caused TypeError on homepage)
      await ensureAuthTables(); // V4: Ensure NextAuth tables (accounts, sessions, etc.)
      await ensureAdvisorTablesDB(); // V4: Ensure advisor tables (user_profiles, personalized_recommendations)
      await runMissingColumnMigrations();
      initialized = true;
      lastVerifiedAt = Date.now();
      console.log('[DB Init] ✓ Tables verified (including site_settings + V61 + V62 + V118 + V150 + video + council_briefs + auth + advisor)');
      return;
    } catch (checkErr: any) {
      console.log('[DB Init] Tables missing, will create them... Reason:', checkErr.message?.slice(0, 100));
    }

    // Strategy 2: Create ALL tables manually with raw SQL
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[DB Init] Creating ALL tables with raw SQL (attempt ${attempt}/3)...`);
        await createAllTablesManually();
        // Verify the main table was actually created
        await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
        initialized = true;
        lastVerifiedAt = Date.now();
        console.log('[DB Init] ✓ All tables created and verified via raw SQL');
        return;
      } catch (sqlErr: any) {
        console.error(`[DB Init] Raw SQL attempt ${attempt} failed:`, sqlErr.message?.slice(0, 200));
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    // Strategy 3: REMOVED — prisma db push was causing data loss!
    // Even without --accept-data-loss, prisma db push can detect schema drift
    // between raw SQL tables and the Prisma schema, and run destructive
    // ALTER/DROP operations. This was the most likely cause of articles
    // disappearing on every deploy. Raw SQL table creation is sufficient.

    // Strategy 4: Final raw SQL attempt
    if (!initialized) {
      try {
        console.log('[DB Init] Final attempt: creating tables manually again...');
        await createAllTablesManually();
        await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
        initialized = true;
        lastVerifiedAt = Date.now();
        console.log('[DB Init] ✓ Tables created on final attempt');
      } catch (finalErr: any) {
        console.error('[DB Init] ✗ All table creation methods failed:', finalErr.message?.slice(0, 200));
      }
    }
  })();

  return initPromise;
}

// ─── Ensure site_settings table exists (critical for lock system) ──
// This is called separately because site_settings was added after news_items,
// and many deployments have news_items but not site_settings.
// Without site_settings, the entire lock system breaks and pipeline stalls.
async function ensureSiteSettingsTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT DEFAULT '',
        type TEXT DEFAULT 'string',
        "group" TEXT DEFAULT 'general'
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS site_settings_key_idx ON site_settings(key)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS site_settings_group_idx ON site_settings("group")`);
    console.log('[DB Init] ✓ site_settings table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] site_settings warning:', err.message?.slice(0, 100));
    }
  }
}

// ─── Ensure NextAuth tables exist (accounts, sessions, verification_tokens, passkeys) ──
// V4: These are REQUIRED for Google OAuth to work. Previously missing from raw SQL,
// so the accounts table never got created, causing all OAuth callbacks to fail.
async function ensureAuthTables(): Promise<void> {
  const tables = [
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      "sessionToken" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL,
      expires TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS passkeys (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "credentialId" TEXT UNIQUE NOT NULL,
      "publicKey" BYTEA NOT NULL,
      counter INTEGER DEFAULT 0,
      "deviceType" TEXT DEFAULT 'singleDevice',
      "backedUp" BOOLEAN DEFAULT false,
      transports TEXT DEFAULT '[]',
      name TEXT,
      "lastUsedAt" TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,
  ];

  for (const sql of tables) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch (err: any) {
      if (!err.message?.includes('already exists')) {
        console.warn('[DB Init] Auth table warning:', err.message?.slice(0, 100));
      }
    }
  }

  // Indexes
  const indexes = [
    `CREATE INDEX IF NOT EXISTS accounts_userId_idx ON accounts("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_providerAccountId_idx ON accounts(provider, "providerAccountId")`,
    `CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS verification_tokens_identifier_token_idx ON verification_tokens(identifier, token)`,
    `CREATE INDEX IF NOT EXISTS passkeys_userId_idx ON passkeys("userId")`,
    `CREATE INDEX IF NOT EXISTS passkeys_credentialId_idx ON passkeys("credentialId")`,
  ];
  for (const idx of indexes) {
    try { await db.$executeRawUnsafe(idx); } catch {}
  }

  // Foreign keys
  const fkeys = [
    `ALTER TABLE accounts ADD CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE sessions ADD CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE passkeys ADD CONSTRAINT passkeys_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
  ];
  for (const fk of fkeys) {
    try { await db.$executeRawUnsafe(fk); } catch {}
  }

  // Verify accounts table was created
  try {
    const cols = await db.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts'`
    ) as any[];
    if (cols.length > 0) {
      console.log(`[DB Init] ✓ NextAuth tables ensured (accounts: ${cols.length} columns)`);
    } else {
      console.error('[DB Init] ❌ accounts table still empty after creation — Google OAuth will fail!');
    }
  } catch (err: any) {
    console.warn('[DB Init] Could not verify accounts table:', err.message?.slice(0, 80));
  }
}

// ─── Ensure Advisor tables exist (user_profiles, personalized_recommendations) ──
// V4: Same pattern as ensureAuthTables — these tables were missing from raw SQL,
// causing /api/advisor/profile to fail with 500 on every request.
async function ensureAdvisorTablesDB(): Promise<void> {
  const tables = [
    `CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE NOT NULL,
      "experienceLevel" TEXT DEFAULT 'beginner',
      "riskTolerance" TEXT DEFAULT 'moderate',
      "investmentHorizon" TEXT DEFAULT 'medium',
      "preferredAssets" TEXT DEFAULT '[]',
      "preferredMarkets" TEXT DEFAULT '[]',
      "capitalRange" TEXT DEFAULT 'unknown',
      "tradingFrequency" TEXT DEFAULT 'weekly',
      interests TEXT DEFAULT '[]',
      "onboardingComplete" BOOLEAN DEFAULT false,
      "onboardingStep" INTEGER DEFAULT 0,
      "lastAdvisorRun" TIMESTAMP,
      "advisorEnabled" BOOLEAN DEFAULT true,
      "excludedAssets" TEXT DEFAULT '[]',
      "minConfidenceScore" INTEGER DEFAULT 40,
      "successRate" DOUBLE PRECISION DEFAULT 0,
      "allowGeneralRecommendations" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS personalized_recommendations (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "recommendationType" TEXT NOT NULL,
      title TEXT NOT NULL,
      "titleEn" TEXT,
      summary TEXT DEFAULT '',
      reasoning TEXT DEFAULT '',
      "actionItems" TEXT DEFAULT '[]',
      "relatedAssetClasses" TEXT DEFAULT '[]',
      "relatedSymbols" TEXT DEFAULT '[]',
      "relatedReportIds" TEXT DEFAULT '[]',
      "relatedNewsIds" TEXT DEFAULT '[]',
      "confidenceScore" INTEGER DEFAULT 50,
      "urgencyLevel" TEXT DEFAULT 'normal',
      "validFrom" TIMESTAMP DEFAULT NOW(),
      "validUntil" TIMESTAMP,
      "isRead" BOOLEAN DEFAULT false,
      "isDismissed" BOOLEAN DEFAULT false,
      "isActioned" BOOLEAN DEFAULT false,
      "userFeedback" TEXT,
      "sourceData" TEXT DEFAULT '{}',
      "generatedBy" TEXT DEFAULT 'advisor',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,
  ];

  for (const sql of tables) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch (err: any) {
      if (!err.message?.includes('already exists')) {
        console.warn('[DB Init] Advisor table warning:', err.message?.slice(0, 100));
      }
    }
  }

  // V122: Add PR#23 columns to personalized_recommendations (missing from original raw SQL)
  const pr23Columns = [
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "reportId" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "reportSlug" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "reportTitle" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "asset" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "action" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "entryPrice" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "targetPrice" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "stopLoss" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "timeHorizon" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "allocationPercent" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "feedbackType" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "executedAt" TIMESTAMP`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "executionPrice" TEXT`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "actualProfitLoss" DOUBLE PRECISION`,
    `ALTER TABLE personalized_recommendations ADD COLUMN IF NOT EXISTS "isSuccessful" BOOLEAN`,
  ];
  for (const col of pr23Columns) {
    try { await db.$executeRawUnsafe(col); } catch {} // IF NOT EXISTS handles it
  }
  console.log('[DB Init] ✓ PR#23 columns ensured for personalized_recommendations');

  // PR#23: Add missing allowGeneralRecommendations column to user_profiles
  // This was accidentally omitted from the CREATE TABLE — must be added via ALTER TABLE
  const userProfileMissingCols = [
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS "allowGeneralRecommendations" BOOLEAN NOT NULL DEFAULT false`,
  ];
  for (const col of userProfileMissingCols) {
    try { await db.$executeRawUnsafe(col); } catch {}
  }
  console.log('[DB Init] ✓ Missing user_profiles columns ensured (allowGeneralRecommendations)');

  // Indexes
  const indexes = [
    `CREATE INDEX IF NOT EXISTS user_profiles_userId_idx ON user_profiles("userId")`,
    `CREATE INDEX IF NOT EXISTS user_profiles_experienceLevel_idx ON user_profiles("experienceLevel")`,
    `CREATE INDEX IF NOT EXISTS user_profiles_riskTolerance_idx ON user_profiles("riskTolerance")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_userId_isRead_idx ON personalized_recommendations("userId", "isRead")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_userId_isDismissed_idx ON personalized_recommendations("userId", "isDismissed")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_userId_createdAt_idx ON personalized_recommendations("userId", "createdAt")`,
  ];
  for (const idx of indexes) {
    try { await db.$executeRawUnsafe(idx); } catch {}
  }

  // UNIQUE constraint on user_profiles.userId
  // CRITICAL: CREATE TABLE IF NOT EXISTS won't add this constraint if the table
  // already exists without it. Without it, Prisma findUnique/upsert on userId fails.
  try {
    const hasUnique = await db.$queryRawUnsafe(
      `SELECT tc.constraint_name FROM information_schema.table_constraints tc ` +
      `JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name ` +
      `WHERE tc.table_name = 'user_profiles' AND tc.constraint_type = 'UNIQUE' AND ccu.column_name = 'userId'`
    ) as any[];
    if (hasUnique.length === 0) {
      // Remove duplicate userId rows first (keep the latest)
      try {
        await db.$executeRawUnsafe(`DELETE FROM user_profiles a USING user_profiles b WHERE a.id < b.id AND a."userId" = b."userId"`);
      } catch {}
      await db.$executeRawUnsafe(`ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_key" UNIQUE ("userId")`);
      console.log('[DB Init] ✓ Added UNIQUE constraint on user_profiles.userId');
    }
  } catch (e: any) {
    if (!e.message?.includes('already exists')) {
      console.warn('[DB Init] UNIQUE constraint on user_profiles.userId:', e.message?.slice(0, 100));
    }
  }

  // Foreign keys
  const fkeys = [
    `ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE personalized_recommendations ADD CONSTRAINT pers_rec_profileId_fkey FOREIGN KEY ("profileId") REFERENCES user_profiles(id) ON DELETE CASCADE`,
  ];
  for (const fk of fkeys) {
    try { await db.$executeRawUnsafe(fk); } catch {}
  }

  // Verify
  try {
    const cols = await db.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'`
    ) as any[];
    if (cols.length > 0) {
      console.log(`[DB Init] ✓ Advisor tables ensured (user_profiles: ${cols.length} columns)`);
    } else {
      console.error('[DB Init] ❌ user_profiles table still empty — advisor will fail!');
    }
  } catch (err: any) {
    console.warn('[DB Init] Could not verify user_profiles:', err.message?.slice(0, 80));
  }
}

// ─── Ensure V61 tables exist (economic_reports, market_analyses, market_indicators) ──
// These were added in V61 and must be created even when news_items already exists.
async function ensureV61Tables(): Promise<void> {
  // Economic Reports
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS economic_reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT,
        summary TEXT DEFAULT '',
        content TEXT DEFAULT '',
        "reportType" TEXT DEFAULT 'weekly',
        scope TEXT DEFAULT 'global',
        locale TEXT DEFAULT 'ar',
        sectors TEXT DEFAULT '[]',
        countries TEXT DEFAULT '[]',
        "keyIndicators" TEXT DEFAULT '{}',
        "marketImpact" TEXT DEFAULT 'neutral',
        "confidenceScore" INTEGER DEFAULT 50,
        "sourceUrls" TEXT DEFAULT '[]',
        "imageUrl" TEXT,
        "isPublished" BOOLEAN DEFAULT false,
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    // V256: Composite unique on (slug, locale) — same slug allowed in different locales
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS economic_reports_slug_locale_idx ON economic_reports(slug, locale)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_reportType_createdAt_idx ON economic_reports("reportType", "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_scope_createdAt_idx ON economic_reports(scope, "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_isPublished_publishedAt_idx ON economic_reports("isPublished", "publishedAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_slug_idx ON economic_reports(slug)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_locale_idx ON economic_reports(locale)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_isPublished_locale_publishedAt_idx ON economic_reports("isPublished", locale, "publishedAt")`);
    console.log('[DB Init] ✓ economic_reports table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] economic_reports warning:', err.message?.slice(0, 100));
    }
  }

  // Market Analyses
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS market_analyses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT,
        "assetClass" TEXT DEFAULT 'stocks',
        "analysisType" TEXT DEFAULT 'fundamental',
        "timeFrame" TEXT DEFAULT 'daily',
        locale TEXT DEFAULT 'ar',
        content TEXT DEFAULT '',
        indicators TEXT DEFAULT '{}',
        "priceTarget" TEXT DEFAULT '{}',
        "riskLevel" TEXT DEFAULT 'medium',
        sentiment TEXT DEFAULT 'neutral',
        "confidenceScore" INTEGER DEFAULT 50,
        "sourceRef" TEXT,
        "relatedNewsIds" TEXT DEFAULT '[]',
        "isPublished" BOOLEAN DEFAULT false,
        "publishedAt" TIMESTAMP,
        "validUntil" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    // V256: Composite unique on (slug, locale) — same slug allowed in different locales
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS market_analyses_slug_locale_idx ON market_analyses(slug, locale)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_analyses_assetClass_createdAt_idx ON market_analyses("assetClass", "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_analyses_analysisType_createdAt_idx ON market_analyses("analysisType", "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_analyses_isPublished_publishedAt_idx ON market_analyses("isPublished", "publishedAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_analyses_locale_idx ON market_analyses(locale)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_analyses_slug_idx ON market_analyses(slug)`);
    console.log('[DB Init] ✓ market_analyses table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] market_analyses warning:', err.message?.slice(0, 100));
    }
  }

  // Market Indicators
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS market_indicators (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "nameAr" TEXT,
        symbol TEXT UNIQUE,
        value DOUBLE PRECISION DEFAULT 0,
        change DOUBLE PRECISION DEFAULT 0,
        "changePercent" DOUBLE PRECISION DEFAULT 0,
        category TEXT DEFAULT 'index',
        region TEXT DEFAULT 'global',
        history TEXT DEFAULT '[]',
        "lastUpdated" TIMESTAMP DEFAULT NOW(),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_indicators_category_region_idx ON market_indicators(category, region)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_indicators_symbol_idx ON market_indicators(symbol)`);
    console.log('[DB Init] ✓ market_indicators table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] market_indicators warning:', err.message?.slice(0, 100));
    }
  }
}

// ─── Ensure V62 tables exist (report_subscriptions, economic_events, report_views) ──
// These were added in V62 and must be created even when news_items already exists.
async function ensureV62Tables(): Promise<void> {
  // Report Subscriptions
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS report_subscriptions (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        frequency TEXT DEFAULT 'daily',
        categories TEXT DEFAULT '[]',
        regions TEXT DEFAULT '[]',
        "isActive" BOOLEAN DEFAULT true,
        "confirmToken" TEXT,
        "isConfirmed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS report_subscriptions_email_idx ON report_subscriptions(email)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS report_subscriptions_frequency_isActive_idx ON report_subscriptions(frequency, "isActive")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS report_subscriptions_confirmToken_idx ON report_subscriptions("confirmToken")`);
    console.log('[DB Init] ✓ report_subscriptions table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] report_subscriptions warning:', err.message?.slice(0, 100));
    }
  }

  // Economic Events
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS economic_events (
        id TEXT PRIMARY KEY,
        "eventName" TEXT NOT NULL,
        "eventNameAr" TEXT,
        country TEXT NOT NULL,
        currency TEXT NOT NULL,
        "eventDate" TIMESTAMP NOT NULL,
        importance TEXT DEFAULT 'medium',
        "eventType" TEXT DEFAULT 'indicator',
        forecast TEXT,
        previous TEXT,
        actual TEXT,
        source TEXT DEFAULT 'manual',
        "isActualReleased" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_events_eventDate_idx ON economic_events("eventDate")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_events_country_eventDate_idx ON economic_events(country, "eventDate")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_events_importance_eventDate_idx ON economic_events(importance, "eventDate")`);
    console.log('[DB Init] ✓ economic_events table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] economic_events warning:', err.message?.slice(0, 100));
    }
  }

  // Report Views
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS report_views (
        id TEXT PRIMARY KEY,
        "reportId" TEXT NOT NULL,
        "reportType" TEXT NOT NULL,
        "userId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        referrer TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS report_views_reportId_createdAt_idx ON report_views("reportId", "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS report_views_reportType_idx ON report_views("reportType")`);
    console.log('[DB Init] ✓ report_views table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] report_views warning:', err.message?.slice(0, 100));
    }
  }
}

// ─── Ensure V118 tables exist (news_item_archives) ──
// Added in V118 for archiving processed/old news items.
async function ensureV118Tables(): Promise<void> {
  // News Item Archives
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS news_item_archives (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        "titleAr" TEXT,
        summary TEXT DEFAULT '',
        "summaryAr" TEXT,
        content TEXT DEFAULT '',
        "contentAr" TEXT,
        source TEXT DEFAULT '',
        "sourceName" TEXT DEFAULT '',
        url TEXT DEFAULT '',
        category TEXT DEFAULT 'اقتصاد كلي',
        sentiment TEXT DEFAULT 'neutral',
        "sentimentScore" INTEGER DEFAULT 55,
        "impactLevel" TEXT DEFAULT 'low',
        "impactScore" INTEGER DEFAULT 0,
        "originalLanguage" TEXT DEFAULT 'en',
        "newsType" TEXT DEFAULT 'live',
        "affectedAssets" TEXT DEFAULT '[]',
        "aiAnalysis" TEXT,
        "isPublished" BOOLEAN DEFAULT true,
        "isReady" BOOLEAN DEFAULT true,
        "processingStage" TEXT DEFAULT 'imaged',
        "retryCount" INTEGER DEFAULT 0,
        "rejectCount" INTEGER DEFAULT 0,
        "lastError" TEXT,
        "imageUrl" TEXT,
        "generatedImage" TEXT,
        slug TEXT UNIQUE,
        views INTEGER DEFAULT 0,
        "publishedAt" TIMESTAMP,
        "fetchedAt" TIMESTAMP DEFAULT NOW(),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "archivedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_item_archives_newsType_fetchedAt_idx ON news_item_archives("newsType", "fetchedAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_item_archives_category_idx ON news_item_archives(category)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_item_archives_slug_idx ON news_item_archives(slug)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_item_archives_archivedAt_idx ON news_item_archives("archivedAt")`);
    console.log('[DB Init] ✓ news_item_archives table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] news_item_archives warning:', err.message?.slice(0, 100));
    }
  }
}

// ─── Ensure Infographics table exists ──
// Added for the infographic feature — converts news/reports to visual slides.
async function ensureInfographicsTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS infographics (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        title TEXT NOT NULL,
        subtitle TEXT,
        "sourceType" TEXT NOT NULL,
        "sourceId" TEXT,
        "sourceTitle" TEXT,
        category TEXT,
        slides JSONB NOT NULL DEFAULT '[]',
        "thumbnailUrl" TEXT,
        "impactScore" INTEGER,
        "viewCount" INTEGER DEFAULT 0,
        "isPublished" BOOLEAN DEFAULT false,
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_sourceType_sourceId_idx ON infographics("sourceType", "sourceId")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_category_idx ON infographics(category)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_isPublished_publishedAt_idx ON infographics("isPublished", "publishedAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_slug_idx ON infographics(slug)`);
    console.log('[DB Init] ✓ infographics table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] infographics warning:', err.message?.slice(0, 100));
    }
  }
}

// ─── Ensure V150 tables exist (trading_signals, portfolio_holdings, portfolio_trades) ──
// Added in V150 for trading signal persistence and portfolio tracking.
async function ensureV150Tables(): Promise<void> {
  // Trading Signals
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS trading_signals (
        id TEXT PRIMARY KEY,
        pair TEXT NOT NULL,
        action TEXT NOT NULL,
        confidence INTEGER DEFAULT 50,
        reason TEXT DEFAULT '',
        "entryPrice" DOUBLE PRECISION,
        "stopLoss" DOUBLE PRECISION,
        "takeProfit" DOUBLE PRECISION,
        status TEXT DEFAULT 'active',
        source TEXT DEFAULT 'local-fallback',
        category TEXT DEFAULT 'crypto',
        timeframe TEXT DEFAULT 'H4',
        "rsiAtSignal" DOUBLE PRECISION,
        "sma20AtSignal" DOUBLE PRECISION,
        "sma50AtSignal" DOUBLE PRECISION,
        "closedAt" TIMESTAMP,
        "closePrice" DOUBLE PRECISION,
        "profitPips" DOUBLE PRECISION,
        "profitPercent" DOUBLE PRECISION,
        "isWin" BOOLEAN,
        "councilVotes" TEXT DEFAULT '{}',
        "councilModels" TEXT DEFAULT '[]',
        "relatedNewsIds" TEXT DEFAULT '[]',
        notes TEXT,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_pair_status_createdAt_idx ON trading_signals(pair, status, "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_action_status_idx ON trading_signals(action, status)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_source_createdAt_idx ON trading_signals(source, "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_status_createdAt_idx ON trading_signals(status, "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_isWin_idx ON trading_signals("isWin")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_category_idx ON trading_signals(category)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS trading_signals_expiresAt_idx ON trading_signals("expiresAt")`);
    console.log('[DB Init] ✓ trading_signals table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] trading_signals warning:', err.message?.slice(0, 100));
    }
  }

  // Portfolio Holdings
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS portfolio_holdings (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        "nameAr" TEXT,
        category TEXT DEFAULT 'crypto',
        quantity DOUBLE PRECISION DEFAULT 0,
        "avgBuyPrice" DOUBLE PRECISION DEFAULT 0,
        "currentPrice" DOUBLE PRECISION DEFAULT 0,
        "costBasis" DOUBLE PRECISION DEFAULT 0,
        "marketValue" DOUBLE PRECISION DEFAULT 0,
        "unrealizedPL" DOUBLE PRECISION DEFAULT 0,
        "unrealizedPLPct" DOUBLE PRECISION DEFAULT 0,
        allocation DOUBLE PRECISION DEFAULT 0,
        "firstBuyDate" TIMESTAMP,
        "lastTradeDate" TIMESTAMP,
        notes TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS portfolio_holdings_userId_isActive_idx ON portfolio_holdings("userId", "isActive")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS portfolio_holdings_symbol_idx ON portfolio_holdings(symbol)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS portfolio_holdings_category_idx ON portfolio_holdings(category)`);
    console.log('[DB Init] ✓ portfolio_holdings table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] portfolio_holdings warning:', err.message?.slice(0, 100));
    }
  }

  // Portfolio Trades
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS portfolio_trades (
        id TEXT PRIMARY KEY,
        "holdingId" TEXT NOT NULL,
        "userId" TEXT,
        symbol TEXT NOT NULL,
        "tradeType" TEXT NOT NULL,
        quantity DOUBLE PRECISION NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        fees DOUBLE PRECISION DEFAULT 0,
        notes TEXT,
        "tradeDate" TIMESTAMP DEFAULT NOW(),
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS portfolio_trades_holdingId_tradeDate_idx ON portfolio_trades("holdingId", "tradeDate")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS portfolio_trades_userId_idx ON portfolio_trades("userId")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS portfolio_trades_symbol_tradeDate_idx ON portfolio_trades(symbol, "tradeDate")`);
    console.log('[DB Init] ✓ portfolio_trades table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] portfolio_trades warning:', err.message?.slice(0, 100));
    }
  }
}

// ─── Ensure V318: video_reports table exists ──
// Added for the interactive video player feature.
async function ensureVideoReportsTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS video_reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        symbol TEXT NOT NULL,
        "assetName" TEXT NOT NULL,
        locale TEXT DEFAULT 'ar',
        "reportType" TEXT DEFAULT 'analysis',
        "assetClass" TEXT DEFAULT 'stocks',
        "videoUrl" TEXT,
        "thumbnailUrl" TEXT,
        duration DOUBLE PRECISION,
        "sourceReportId" TEXT,
        "sourceType" TEXT,
        "analysisText" TEXT DEFAULT '',
        "chartMode" TEXT DEFAULT 'bg',
        "marketImpact" TEXT DEFAULT 'neutral',
        status TEXT DEFAULT 'pending',
        error TEXT,
        "viewCount" INTEGER DEFAULT 0,
        "isPublished" BOOLEAN DEFAULT false,
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    // Unique constraint on slug + locale
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS video_reports_slug_locale_idx ON video_reports(slug, locale)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS video_reports_symbol_idx ON video_reports(symbol)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS video_reports_locale_idx ON video_reports(locale)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS video_reports_assetClass_idx ON video_reports("assetClass")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS video_reports_status_idx ON video_reports(status)`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS video_reports_isPublished_locale_publishedAt_idx ON video_reports("isPublished", locale, "publishedAt")`);
    // Add marketImpact column if missing (migration for existing databases)
    try { await db.$executeRawUnsafe(`ALTER TABLE video_reports ADD COLUMN IF NOT EXISTS "marketImpact" TEXT DEFAULT 'neutral'`); } catch {}
    // V26: Add style column if missing (pulse | dataviz)
    try { await db.$executeRawUnsafe(`ALTER TABLE video_reports ADD COLUMN IF NOT EXISTS "style" TEXT DEFAULT 'pulse'`); } catch {}
    console.log('[DB Init] ✓ video_reports table ensured (V318)');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] video_reports warning:', err.message?.slice(0, 100));
    }
  }
}

// ── V5: Ensure council_briefs table exists ──
// Was missing from db-init.ts, causing db.councilBrief.findMany() to fail
// with "relation does not exist" on the homepage.
async function ensureCouncilBriefsTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS council_briefs (
        id TEXT PRIMARY KEY,
        pair TEXT NOT NULL,
        direction TEXT NOT NULL,
        "entryPrice" DOUBLE PRECISION NOT NULL,
        "stopLoss" DOUBLE PRECISION NOT NULL,
        "takeProfit" DOUBLE PRECISION NOT NULL,
        confidence INTEGER DEFAULT 50,
        timeframe TEXT DEFAULT 'H4',
        "isActive" BOOLEAN DEFAULT true,
        "reviewStatus" TEXT DEFAULT 'PENDING',
        "analysisSummary" TEXT DEFAULT '',
        "consensusJson" TEXT DEFAULT '{}',
        source TEXT DEFAULT 'local-fallback',
        "sessionAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS council_briefs_isActive_createdAt_idx ON council_briefs("isActive", "createdAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS council_briefs_pair_isActive_idx ON council_briefs(pair, "isActive")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS council_briefs_reviewStatus_idx ON council_briefs("reviewStatus")`);
    console.log('[DB Init] ✓ council_briefs table ensured (V5)');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] council_briefs warning:', err.message?.slice(0, 100));
    }
  }
}

async function ensureAdsTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "targetUrl" TEXT NOT NULL,
        position TEXT DEFAULT 'sidebar',
        "isActive" BOOLEAN DEFAULT true,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        "startDate" TIMESTAMP DEFAULT NOW(),
        "endDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS advertisements_position_isActive_idx ON advertisements(position, "isActive")`);
    console.log('[DB Init] ✓ advertisements table ensured');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB Init] advertisements warning:', err.message?.slice(0, 100));
    }
  }
}

async function createAllTablesManually(): Promise<void> {
  // ── Create ALL tables matching the Prisma schema ──
  // Order matters: tables referenced by foreign keys must be created first

  const tables: string[] = [
    // ── Core: news_items ──
    `CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      "titleAr" TEXT,
      summary TEXT NOT NULL DEFAULT '',
      "summaryAr" TEXT,
      content TEXT DEFAULT '',
      "contentAr" TEXT DEFAULT '',
      source TEXT DEFAULT '',
      "sourceName" TEXT DEFAULT '',
      url TEXT DEFAULT '',
      category TEXT DEFAULT 'اقتصاد كلي',
      sentiment TEXT DEFAULT 'neutral',
      "sentimentScore" INTEGER DEFAULT 55,
      "impactLevel" TEXT DEFAULT 'low',
      "originalLanguage" TEXT DEFAULT 'en',
      "newsType" TEXT DEFAULT 'live',
      "affectedAssets" TEXT DEFAULT '[]',
      "aiAnalysis" TEXT,
      "isPublished" BOOLEAN DEFAULT false,
      "isReady" BOOLEAN DEFAULT false,
      "processingStage" TEXT DEFAULT 'fetched',
      "imageUrl" TEXT,
      "generatedImage" TEXT,
      slug TEXT UNIQUE,
      views INTEGER DEFAULT 0,
      "retryCount" INTEGER NOT NULL DEFAULT 0,
      "rejectCount" INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "publishedAt" TIMESTAMP,
      "impactScore" INTEGER NOT NULL DEFAULT 0,
      "fetchedAt" TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Core: news_fetch_logs ──
    `CREATE TABLE IF NOT EXISTS news_fetch_logs (
      id TEXT PRIMARY KEY,
      "newsType" TEXT,
      status TEXT,
      "itemsFetched" INTEGER DEFAULT 0,
      "itemsSaved" INTEGER DEFAULT 0,
      errors TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Pipeline: pipeline_runs ──
    `CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'running',
      trigger TEXT DEFAULT 'manual',
      config TEXT DEFAULT '{}',
      "articlesPublished" INTEGER DEFAULT 0,
      "articlesSkipped" INTEGER DEFAULT 0,
      "articlesFailed" INTEGER DEFAULT 0,
      "totalDuration" INTEGER DEFAULT 0,
      summary TEXT DEFAULT '',
      "stepsJson" TEXT DEFAULT '[]',
      error TEXT,
      "startedAt" TIMESTAMP DEFAULT NOW(),
      "completedAt" TIMESTAMP
    )`,

    // ── Pipeline: agent_logs ──
    `CREATE TABLE IF NOT EXISTS agent_logs (
      id TEXT PRIMARY KEY,
      "pipelineRunId" TEXT,
      agent TEXT,
      action TEXT,
      "inputJson" TEXT DEFAULT '{}',
      "outputJson" TEXT DEFAULT 'null',
      success BOOLEAN DEFAULT true,
      duration INTEGER DEFAULT 0,
      error TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Calendar: calendar_events ──
    `CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      "eventName" TEXT NOT NULL,
      "eventNameAr" TEXT,
      country TEXT NOT NULL,
      currency TEXT NOT NULL,
      "eventDate" TIMESTAMP NOT NULL,
      forecast TEXT,
      previous TEXT,
      actual TEXT,
      impact TEXT DEFAULT 'MEDIUM',
      source TEXT DEFAULT 'manual',
      "isActualReleased" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Users: users ──
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      "passwordHash" TEXT,
      image TEXT,
      role TEXT DEFAULT 'user',
      provider TEXT DEFAULT 'email',
      plan TEXT DEFAULT 'free',
      "planExpiresAt" TIMESTAMP,
      "emailVerified" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── NextAuth: accounts (OAuth + credentials) ──
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── NextAuth: sessions ──
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      "sessionToken" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL,
      expires TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── NextAuth: verification_tokens ──
    `CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── NextAuth: passkeys ──
    `CREATE TABLE IF NOT EXISTS passkeys (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "credentialId" TEXT UNIQUE NOT NULL,
      "publicKey" BYTEA NOT NULL,
      counter INTEGER DEFAULT 0,
      "deviceType" TEXT DEFAULT 'singleDevice',
      "backedUp" BOOLEAN DEFAULT false,
      transports TEXT DEFAULT '[]',
      name TEXT,
      "lastUsedAt" TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Users: bookmarks (references users + news_items) ──
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      "newsId" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Users: notifications ──
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      title TEXT,
      message TEXT,
      type TEXT DEFAULT 'info',
      "isRead" BOOLEAN DEFAULT false,
      link TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Users: price_alerts ──
    `CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      symbol TEXT,
      "targetPrice" DOUBLE PRECISION,
      direction TEXT DEFAULT 'above',
      "isTriggered" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "triggeredAt" TIMESTAMP
    )`,

    // ── Subscriptions ──
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      plan TEXT DEFAULT 'free',
      status TEXT DEFAULT 'active',
      "startDate" TIMESTAMP DEFAULT NOW(),
      "endDate" TIMESTAMP,
      "paymentMethod" TEXT,
      amount DOUBLE PRECISION,
      currency TEXT DEFAULT 'USD',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Newsletter ──
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      status TEXT DEFAULT 'active',
      source TEXT DEFAULT 'website',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Contact ──
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      subject TEXT DEFAULT '',
      message TEXT,
      status TEXT DEFAULT 'new',
      reply TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Site Settings ──
    `CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE,
      value TEXT DEFAULT '',
      type TEXT DEFAULT 'string',
      "group" TEXT DEFAULT 'general'
    )`,

    // ── Smart Alerts ──
    `CREATE TABLE IF NOT EXISTS smart_alerts (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      "alertType" TEXT,
      symbol TEXT,
      condition TEXT,
      threshold DOUBLE PRECISION,
      keywords TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "isTriggered" BOOLEAN DEFAULT false,
      "lastTriggeredAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── API Keys ──
    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      key TEXT UNIQUE,
      name TEXT DEFAULT 'Default',
      plan TEXT DEFAULT 'free',
      "rateLimit" INTEGER DEFAULT 100,
      "isActive" BOOLEAN DEFAULT true,
      "lastUsedAt" TIMESTAMP,
      "expiresAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Community: discussions ──
    `CREATE TABLE IF NOT EXISTS discussions (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      title TEXT,
      content TEXT,
      category TEXT DEFAULT 'general',
      tags TEXT DEFAULT '[]',
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      "replyCount" INTEGER DEFAULT 0,
      "isPinned" BOOLEAN DEFAULT false,
      "isLocked" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Community: discussion_replies ──
    `CREATE TABLE IF NOT EXISTS discussion_replies (
      id TEXT PRIMARY KEY,
      "discussionId" TEXT,
      "userId" TEXT,
      content TEXT,
      upvotes INTEGER DEFAULT 0,
      "isAccepted" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Telegram ──
    `CREATE TABLE IF NOT EXISTS telegram_accounts (
      id TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE,
      "telegramChatId" TEXT UNIQUE,
      "telegramUsername" TEXT,
      "notificationPrefs" TEXT DEFAULT '{}',
      "isConnected" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Reports ──
    `CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT,
      "reportType" TEXT,
      content TEXT,
      "summaryAr" TEXT,
      period TEXT,
      "isPublished" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Prisma migrations tracking ──
    `CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      finished_at TIMESTAMP,
      migration_name TEXT NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMP,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )`,

    // ── Chat History: sessions and messages for assistant ──
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      locale TEXT NOT NULL DEFAULT 'ar',
      title TEXT,
      "pageUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      "toolCalls" TEXT,
      "toolResults" TEXT,
      sources TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chat_messages_sessionId_fkey FOREIGN KEY ("sessionId") REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS chat_sessions_userId_idx ON chat_sessions("userId")`,
    `CREATE INDEX IF NOT EXISTS chat_sessions_locale_idx ON chat_sessions(locale)`,
    `CREATE INDEX IF NOT EXISTS chat_sessions_createdAt_idx ON chat_sessions("createdAt")`,
    `CREATE INDEX IF NOT EXISTS chat_messages_sessionId_idx ON chat_messages("sessionId")`,
    `CREATE INDEX IF NOT EXISTS chat_messages_createdAt_idx ON chat_messages("createdAt")`,

    // ── Comments: Article comments (was missing from raw SQL) ──
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      "newsId" TEXT NOT NULL,
      content TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "parentId" TEXT,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      reports INTEGER DEFAULT 0,
      "isExpert" BOOLEAN DEFAULT false,
      depth INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Monetization: advertisements ──
    `CREATE TABLE IF NOT EXISTS advertisements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "targetUrl" TEXT NOT NULL,
      position TEXT DEFAULT 'sidebar',
      "isActive" BOOLEAN DEFAULT true,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      "startDate" TIMESTAMP DEFAULT NOW(),
      "endDate" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V61: Economic Reports ──
    `CREATE TABLE IF NOT EXISTS economic_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      "reportType" TEXT DEFAULT 'weekly',
      scope TEXT DEFAULT 'global',
      sectors TEXT DEFAULT '[]',
      countries TEXT DEFAULT '[]',
      "keyIndicators" TEXT DEFAULT '{}',
      "marketImpact" TEXT DEFAULT 'neutral',
      "confidenceScore" INTEGER DEFAULT 50,
      "sourceUrls" TEXT DEFAULT '[]',
      "imageUrl" TEXT,
      "isPublished" BOOLEAN DEFAULT false,
      "publishedAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V61: Market Analyses ──
    `CREATE TABLE IF NOT EXISTS market_analyses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      "assetClass" TEXT DEFAULT 'stocks',
      "analysisType" TEXT DEFAULT 'fundamental',
      "timeFrame" TEXT DEFAULT 'daily',
      content TEXT DEFAULT '',
      indicators TEXT DEFAULT '{}',
      "priceTarget" TEXT DEFAULT '{}',
      "riskLevel" TEXT DEFAULT 'medium',
      sentiment TEXT DEFAULT 'neutral',
      "confidenceScore" INTEGER DEFAULT 50,
      "sourceRef" TEXT,
      "relatedNewsIds" TEXT DEFAULT '[]',
      "isPublished" BOOLEAN DEFAULT false,
      "publishedAt" TIMESTAMP,
      "validUntil" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V61: Market Indicators ──
    `CREATE TABLE IF NOT EXISTS market_indicators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "nameAr" TEXT,
      symbol TEXT UNIQUE,
      value DOUBLE PRECISION DEFAULT 0,
      change DOUBLE PRECISION DEFAULT 0,
      "changePercent" DOUBLE PRECISION DEFAULT 0,
      category TEXT DEFAULT 'index',
      region TEXT DEFAULT 'global',
      history TEXT DEFAULT '[]',
      "lastUpdated" TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V62: Report Subscriptions ──
    `CREATE TABLE IF NOT EXISTS report_subscriptions (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      frequency TEXT DEFAULT 'daily',
      categories TEXT DEFAULT '[]',
      regions TEXT DEFAULT '[]',
      "isActive" BOOLEAN DEFAULT true,
      "confirmToken" TEXT,
      "isConfirmed" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V62: Economic Events ──
    `CREATE TABLE IF NOT EXISTS economic_events (
      id TEXT PRIMARY KEY,
      "eventName" TEXT NOT NULL,
      "eventNameAr" TEXT,
      country TEXT NOT NULL,
      currency TEXT NOT NULL,
      "eventDate" TIMESTAMP NOT NULL,
      importance TEXT DEFAULT 'medium',
      "eventType" TEXT DEFAULT 'indicator',
      forecast TEXT,
      previous TEXT,
      actual TEXT,
      source TEXT DEFAULT 'manual',
      "isActualReleased" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V62: Report Views ──
    `CREATE TABLE IF NOT EXISTS report_views (
      id TEXT PRIMARY KEY,
      "reportId" TEXT NOT NULL,
      "reportType" TEXT NOT NULL,
      "userId" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      referrer TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V118: News Item Archives ──
    `CREATE TABLE IF NOT EXISTS news_item_archives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      "titleAr" TEXT,
      summary TEXT DEFAULT '',
      "summaryAr" TEXT,
      content TEXT DEFAULT '',
      "contentAr" TEXT,
      source TEXT DEFAULT '',
      "sourceName" TEXT DEFAULT '',
      url TEXT DEFAULT '',
      category TEXT DEFAULT 'اقتصاد كلي',
      sentiment TEXT DEFAULT 'neutral',
      "sentimentScore" INTEGER DEFAULT 55,
      "impactLevel" TEXT DEFAULT 'low',
      "impactScore" INTEGER DEFAULT 0,
      "originalLanguage" TEXT DEFAULT 'en',
      "newsType" TEXT DEFAULT 'live',
      "affectedAssets" TEXT DEFAULT '[]',
      "aiAnalysis" TEXT,
      "isPublished" BOOLEAN DEFAULT true,
      "isReady" BOOLEAN DEFAULT true,
      "processingStage" TEXT DEFAULT 'imaged',
      "retryCount" INTEGER DEFAULT 0,
      "rejectCount" INTEGER DEFAULT 0,
      "lastError" TEXT,
      "imageUrl" TEXT,
      "generatedImage" TEXT,
      slug TEXT UNIQUE,
      views INTEGER DEFAULT 0,
      "publishedAt" TIMESTAMP,
      "fetchedAt" TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "archivedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Infographics ──
    `CREATE TABLE IF NOT EXISTS infographics (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      "sourceType" TEXT NOT NULL,
      "sourceId" TEXT,
      "sourceTitle" TEXT,
      category TEXT,
      slides JSONB NOT NULL DEFAULT '[]',
      "thumbnailUrl" TEXT,
      "impactScore" INTEGER,
      "viewCount" INTEGER DEFAULT 0,
      "isPublished" BOOLEAN DEFAULT false,
      "publishedAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V150: Trading Signals ──
    `CREATE TABLE IF NOT EXISTS trading_signals (
      id TEXT PRIMARY KEY,
      pair TEXT NOT NULL,
      action TEXT NOT NULL,
      confidence INTEGER DEFAULT 50,
      reason TEXT DEFAULT '',
      "entryPrice" DOUBLE PRECISION,
      "stopLoss" DOUBLE PRECISION,
      "takeProfit" DOUBLE PRECISION,
      status TEXT DEFAULT 'active',
      source TEXT DEFAULT 'local-fallback',
      category TEXT DEFAULT 'crypto',
      timeframe TEXT DEFAULT 'H4',
      "rsiAtSignal" DOUBLE PRECISION,
      "sma20AtSignal" DOUBLE PRECISION,
      "sma50AtSignal" DOUBLE PRECISION,
      "closedAt" TIMESTAMP,
      "closePrice" DOUBLE PRECISION,
      "profitPips" DOUBLE PRECISION,
      "profitPercent" DOUBLE PRECISION,
      "isWin" BOOLEAN,
      "councilVotes" TEXT DEFAULT '{}',
      "councilModels" TEXT DEFAULT '[]',
      "relatedNewsIds" TEXT DEFAULT '[]',
      notes TEXT,
      "expiresAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V150: Portfolio Holdings ──
    `CREATE TABLE IF NOT EXISTS portfolio_holdings (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      "nameAr" TEXT,
      category TEXT DEFAULT 'crypto',
      quantity DOUBLE PRECISION DEFAULT 0,
      "avgBuyPrice" DOUBLE PRECISION DEFAULT 0,
      "currentPrice" DOUBLE PRECISION DEFAULT 0,
      "costBasis" DOUBLE PRECISION DEFAULT 0,
      "marketValue" DOUBLE PRECISION DEFAULT 0,
      "unrealizedPL" DOUBLE PRECISION DEFAULT 0,
      "unrealizedPLPct" DOUBLE PRECISION DEFAULT 0,
      allocation DOUBLE PRECISION DEFAULT 0,
      "firstBuyDate" TIMESTAMP,
      "lastTradeDate" TIMESTAMP,
      notes TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── V150: Portfolio Trades ──
    `CREATE TABLE IF NOT EXISTS portfolio_trades (
      id TEXT PRIMARY KEY,
      "holdingId" TEXT NOT NULL,
      "userId" TEXT,
      symbol TEXT NOT NULL,
      "tradeType" TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      "totalAmount" DOUBLE PRECISION NOT NULL,
      fees DOUBLE PRECISION DEFAULT 0,
      notes TEXT,
      "tradeDate" TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,
    // ── Advisor: user_profiles ──
    `CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE NOT NULL,
      "experienceLevel" TEXT DEFAULT 'beginner',
      "riskTolerance" TEXT DEFAULT 'moderate',
      "investmentHorizon" TEXT DEFAULT 'medium',
      "preferredAssets" TEXT DEFAULT '[]',
      "preferredMarkets" TEXT DEFAULT '[]',
      "capitalRange" TEXT DEFAULT 'unknown',
      "tradingFrequency" TEXT DEFAULT 'weekly',
      interests TEXT DEFAULT '[]',
      "onboardingComplete" BOOLEAN DEFAULT false,
      "onboardingStep" INTEGER DEFAULT 0,
      "lastAdvisorRun" TIMESTAMP,
      "advisorEnabled" BOOLEAN DEFAULT true,
      "excludedAssets" TEXT DEFAULT '[]',
      "minConfidenceScore" INTEGER DEFAULT 40,
      "successRate" DOUBLE PRECISION DEFAULT 0,
      "allowGeneralRecommendations" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Advisor: personalized_recommendations ──
    `CREATE TABLE IF NOT EXISTS personalized_recommendations (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "recommendationType" TEXT NOT NULL,
      title TEXT NOT NULL,
      "titleEn" TEXT,
      summary TEXT DEFAULT '',
      reasoning TEXT DEFAULT '',
      "actionItems" TEXT DEFAULT '[]',
      "relatedAssetClasses" TEXT DEFAULT '[]',
      "relatedSymbols" TEXT DEFAULT '[]',
      "relatedReportIds" TEXT DEFAULT '[]',
      "relatedNewsIds" TEXT DEFAULT '[]',
      "confidenceScore" INTEGER DEFAULT 50,
      "urgencyLevel" TEXT DEFAULT 'normal',
      "validFrom" TIMESTAMP DEFAULT NOW(),
      "validUntil" TIMESTAMP,
      "isRead" BOOLEAN DEFAULT false,
      "isDismissed" BOOLEAN DEFAULT false,
      "isActioned" BOOLEAN DEFAULT false,
      "userFeedback" TEXT,
      "sourceData" TEXT DEFAULT '{}',
      "generatedBy" TEXT DEFAULT 'advisor',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // ── Chat History: sessions and messages for assistant ──
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      locale TEXT NOT NULL DEFAULT 'ar',
      title TEXT,
      "pageUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      "toolCalls" TEXT,
      "toolResults" TEXT,
      sources TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chat_messages_sessionId_fkey FOREIGN KEY ("sessionId") REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
  ];

  // Create each table (ignore errors for already-existing tables)
  for (const tableSQL of tables) {
    try {
      await db.$executeRawUnsafe(tableSQL);
    } catch (tableErr: any) {
      // "already exists" errors are OK
      if (!tableErr.message?.includes('already exists')) {
        console.warn('[DB Init] Table creation warning:', tableErr.message?.slice(0, 120));
      }
    }
  }

  // Create indexes (ignore errors if they already exist)
  const indexes = [
    `CREATE INDEX IF NOT EXISTS news_items_newsType_fetchedAt_idx ON news_items("newsType", "fetchedAt")`,
    `CREATE INDEX IF NOT EXISTS news_items_category_idx ON news_items(category)`,
    `CREATE INDEX IF NOT EXISTS news_items_sentiment_idx ON news_items(sentiment)`,
    `CREATE INDEX IF NOT EXISTS news_items_slug_idx ON news_items(slug)`,
    `CREATE INDEX IF NOT EXISTS news_items_url_idx ON news_items(url)`,
    `CREATE INDEX IF NOT EXISTS news_items_isReady_fetchedAt_idx ON news_items("isReady", "fetchedAt")`,
    `CREATE INDEX IF NOT EXISTS news_items_processingStage_idx ON news_items("processingStage")`,
    `CREATE INDEX IF NOT EXISTS news_fetch_logs_newsType_createdAt_idx ON news_fetch_logs("newsType", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS pipeline_runs_status_startedAt_idx ON pipeline_runs(status, "startedAt")`,
    `CREATE INDEX IF NOT EXISTS pipeline_runs_trigger_idx ON pipeline_runs(trigger)`,
    `CREATE INDEX IF NOT EXISTS agent_logs_agent_createdAt_idx ON agent_logs(agent, "createdAt")`,
    `CREATE INDEX IF NOT EXISTS agent_logs_pipelineRunId_idx ON agent_logs("pipelineRunId")`,
    `CREATE INDEX IF NOT EXISTS calendar_events_eventDate_idx ON calendar_events("eventDate")`,
    `CREATE INDEX IF NOT EXISTS calendar_events_country_idx ON calendar_events(country)`,
    `CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`,
    `CREATE INDEX IF NOT EXISTS bookmarks_userId_idx ON bookmarks("userId")`,
    `CREATE INDEX IF NOT EXISTS bookmarks_userId_newsId_idx ON bookmarks("userId", "newsId")`,
    `CREATE INDEX IF NOT EXISTS notifications_userId_isRead_idx ON notifications("userId", "isRead")`,
    `CREATE INDEX IF NOT EXISTS notifications_userId_createdAt_idx ON notifications("userId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS price_alerts_userId_isTriggered_idx ON price_alerts("userId", "isTriggered")`,
    `CREATE INDEX IF NOT EXISTS price_alerts_symbol_isTriggered_idx ON price_alerts(symbol, "isTriggered")`,
    `CREATE INDEX IF NOT EXISTS subscriptions_userId_idx ON subscriptions("userId")`,
    `CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)`,
    `CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers(email)`,
    `CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status)`,
    `CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages(status)`,
    `CREATE INDEX IF NOT EXISTS contact_messages_createdAt_idx ON contact_messages("createdAt")`,
    `CREATE INDEX IF NOT EXISTS site_settings_key_idx ON site_settings(key)`,
    `CREATE INDEX IF NOT EXISTS site_settings_group_idx ON site_settings(group)`,
    `CREATE INDEX IF NOT EXISTS smart_alerts_userId_isActive_idx ON smart_alerts("userId", "isActive")`,
    `CREATE INDEX IF NOT EXISTS smart_alerts_alertType_isActive_idx ON smart_alerts("alertType", "isActive")`,
    `CREATE INDEX IF NOT EXISTS smart_alerts_symbol_isActive_isTriggered_idx ON smart_alerts(symbol, "isActive", "isTriggered")`,
    `CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key)`,
    `CREATE INDEX IF NOT EXISTS api_keys_userId_idx ON api_keys("userId")`,
    `CREATE INDEX IF NOT EXISTS discussions_category_createdAt_idx ON discussions(category, "createdAt")`,
    `CREATE INDEX IF NOT EXISTS discussions_userId_idx ON discussions("userId")`,
    `CREATE INDEX IF NOT EXISTS discussions_isPinned_idx ON discussions("isPinned")`,
    `CREATE INDEX IF NOT EXISTS discussion_replies_discussionId_createdAt_idx ON discussion_replies("discussionId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS discussion_replies_userId_idx ON discussion_replies("userId")`,
    `CREATE INDEX IF NOT EXISTS telegram_accounts_userId_idx ON telegram_accounts("userId")`,
    `CREATE INDEX IF NOT EXISTS telegram_accounts_telegramChatId_idx ON telegram_accounts("telegramChatId")`,
    `CREATE INDEX IF NOT EXISTS reports_reportType_createdAt_idx ON reports("reportType", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS reports_isPublished_idx ON reports("isPublished")`,
    `CREATE INDEX IF NOT EXISTS comments_newsId_createdAt_idx ON comments("newsId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS comments_parentId_idx ON comments("parentId")`,
    `CREATE INDEX IF NOT EXISTS comments_upvotes_idx ON comments(upvotes)`,
    `CREATE INDEX IF NOT EXISTS advertisements_position_isActive_idx ON advertisements(position, "isActive")`,
    // V61: Economic Reports indexes
    `CREATE INDEX IF NOT EXISTS economic_reports_reportType_createdAt_idx ON economic_reports("reportType", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS economic_reports_scope_createdAt_idx ON economic_reports(scope, "createdAt")`,
    `CREATE INDEX IF NOT EXISTS economic_reports_isPublished_publishedAt_idx ON economic_reports("isPublished", "publishedAt")`,
    `CREATE INDEX IF NOT EXISTS economic_reports_slug_idx ON economic_reports(slug)`,
    // V61: Market Analyses indexes
    `CREATE INDEX IF NOT EXISTS market_analyses_assetClass_createdAt_idx ON market_analyses("assetClass", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS market_analyses_analysisType_createdAt_idx ON market_analyses("analysisType", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS market_analyses_isPublished_publishedAt_idx ON market_analyses("isPublished", "publishedAt")`,
    `CREATE INDEX IF NOT EXISTS market_analyses_slug_idx ON market_analyses(slug)`,
    // V61: Market Indicators indexes
    `CREATE INDEX IF NOT EXISTS market_indicators_category_region_idx ON market_indicators(category, region)`,
    `CREATE INDEX IF NOT EXISTS market_indicators_symbol_idx ON market_indicators(symbol)`,
    // V62: Report Subscriptions indexes
    `CREATE INDEX IF NOT EXISTS report_subscriptions_email_idx ON report_subscriptions(email)`,
    `CREATE INDEX IF NOT EXISTS report_subscriptions_frequency_isActive_idx ON report_subscriptions(frequency, "isActive")`,
    `CREATE INDEX IF NOT EXISTS report_subscriptions_confirmToken_idx ON report_subscriptions("confirmToken")`,
    // V62: Economic Events indexes
    `CREATE INDEX IF NOT EXISTS economic_events_eventDate_idx ON economic_events("eventDate")`,
    `CREATE INDEX IF NOT EXISTS economic_events_country_eventDate_idx ON economic_events(country, "eventDate")`,
    `CREATE INDEX IF NOT EXISTS economic_events_importance_eventDate_idx ON economic_events(importance, "eventDate")`,
    // V62: Report Views indexes
    `CREATE INDEX IF NOT EXISTS report_views_reportId_createdAt_idx ON report_views("reportId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS report_views_reportType_idx ON report_views("reportType")`,
    // V118: News Item Archives indexes
    `CREATE INDEX IF NOT EXISTS news_item_archives_newsType_fetchedAt_idx ON news_item_archives("newsType", "fetchedAt")`,
    `CREATE INDEX IF NOT EXISTS news_item_archives_category_idx ON news_item_archives(category)`,
    `CREATE INDEX IF NOT EXISTS news_item_archives_slug_idx ON news_item_archives(slug)`,
    `CREATE INDEX IF NOT EXISTS news_item_archives_archivedAt_idx ON news_item_archives("archivedAt")`,
    // Infographics indexes
    `CREATE INDEX IF NOT EXISTS infographics_sourceType_sourceId_idx ON infographics("sourceType", "sourceId")`,
    `CREATE INDEX IF NOT EXISTS infographics_category_idx ON infographics(category)`,
    `CREATE INDEX IF NOT EXISTS infographics_isPublished_publishedAt_idx ON infographics("isPublished", "publishedAt")`,
    `CREATE INDEX IF NOT EXISTS infographics_slug_idx ON infographics(slug)`,
    // NextAuth: accounts indexes
    `CREATE INDEX IF NOT EXISTS accounts_userId_idx ON accounts("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_providerAccountId_idx ON accounts(provider, "providerAccountId")`,
    // NextAuth: sessions indexes
    `CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions("userId")`,
    // NextAuth: verification_tokens indexes
    `CREATE UNIQUE INDEX IF NOT EXISTS verification_tokens_identifier_token_idx ON verification_tokens(identifier, token)`,
    // NextAuth: passkeys indexes
    `CREATE INDEX IF NOT EXISTS passkeys_userId_idx ON passkeys("userId")`,
    `CREATE INDEX IF NOT EXISTS passkeys_credentialId_idx ON passkeys("credentialId")`,
    // Advisor: user_profiles indexes
    `CREATE INDEX IF NOT EXISTS user_profiles_userId_idx ON user_profiles("userId")`,
    `CREATE INDEX IF NOT EXISTS user_profiles_experienceLevel_idx ON user_profiles("experienceLevel")`,
    `CREATE INDEX IF NOT EXISTS user_profiles_riskTolerance_idx ON user_profiles("riskTolerance")`,
    // Advisor: personalized_recommendations indexes
    `CREATE INDEX IF NOT EXISTS pers_rec_userId_isRead_idx ON personalized_recommendations("userId", "isRead")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_userId_isDismissed_idx ON personalized_recommendations("userId", "isDismissed")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_userId_createdAt_idx ON personalized_recommendations("userId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_type_urgency_idx ON personalized_recommendations("recommendationType", "urgencyLevel")`,
    `CREATE INDEX IF NOT EXISTS pers_rec_validFrom_validUntil_idx ON personalized_recommendations("validFrom", "validUntil")`,
    // V150: Trading Signals indexes
    `CREATE INDEX IF NOT EXISTS trading_signals_pair_status_createdAt_idx ON trading_signals(pair, status, "createdAt")`,
    `CREATE INDEX IF NOT EXISTS trading_signals_action_status_idx ON trading_signals(action, status)`,
    `CREATE INDEX IF NOT EXISTS trading_signals_source_createdAt_idx ON trading_signals(source, "createdAt")`,
    `CREATE INDEX IF NOT EXISTS trading_signals_status_createdAt_idx ON trading_signals(status, "createdAt")`,
    `CREATE INDEX IF NOT EXISTS trading_signals_isWin_idx ON trading_signals("isWin")`,
    `CREATE INDEX IF NOT EXISTS trading_signals_category_idx ON trading_signals(category)`,
    `CREATE INDEX IF NOT EXISTS trading_signals_expiresAt_idx ON trading_signals("expiresAt")`,
    // V150: Portfolio Holdings indexes
    `CREATE INDEX IF NOT EXISTS portfolio_holdings_userId_isActive_idx ON portfolio_holdings("userId", "isActive")`,
    `CREATE INDEX IF NOT EXISTS portfolio_holdings_symbol_idx ON portfolio_holdings(symbol)`,
    `CREATE INDEX IF NOT EXISTS portfolio_holdings_category_idx ON portfolio_holdings(category)`,
    // V150: Portfolio Trades indexes
    `CREATE INDEX IF NOT EXISTS portfolio_trades_holdingId_tradeDate_idx ON portfolio_trades("holdingId", "tradeDate")`,
    `CREATE INDEX IF NOT EXISTS portfolio_trades_userId_idx ON portfolio_trades("userId")`,
    `CREATE INDEX IF NOT EXISTS portfolio_trades_symbol_tradeDate_idx ON portfolio_trades(symbol, "tradeDate")`,
    // Chat History indexes
    `CREATE INDEX IF NOT EXISTS chat_sessions_userId_idx ON chat_sessions("userId")`,
    `CREATE INDEX IF NOT EXISTS chat_sessions_locale_idx ON chat_sessions(locale)`,
    `CREATE INDEX IF NOT EXISTS chat_sessions_createdAt_idx ON chat_sessions("createdAt")`,
    `CREATE INDEX IF NOT EXISTS chat_messages_sessionId_idx ON chat_messages("sessionId")`,
    `CREATE INDEX IF NOT EXISTS chat_messages_createdAt_idx ON chat_messages("createdAt")`,
  ];
  for (const idx of indexes) {
    try {
      await db.$executeRawUnsafe(idx);
    } catch (idxErr: any) {
      // Index creation errors are non-critical
    }
  }

  // Add foreign key constraints (ignore errors - they may already exist)
  const fkeys = [
    `ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_newsId_fkey FOREIGN KEY ("newsId") REFERENCES news_items(id) ON DELETE CASCADE`,
    `ALTER TABLE notifications ADD CONSTRAINT notifications_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE smart_alerts ADD CONSTRAINT smart_alerts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE api_keys ADD CONSTRAINT api_keys_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id)`,
    `ALTER TABLE discussions ADD CONSTRAINT discussions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE discussion_replies ADD CONSTRAINT discussion_replies_discussionId_fkey FOREIGN KEY ("discussionId") REFERENCES discussions(id) ON DELETE CASCADE`,
    `ALTER TABLE discussion_replies ADD CONSTRAINT discussion_replies_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE telegram_accounts ADD CONSTRAINT telegram_accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id)`,
    // NextAuth: accounts FK
    `ALTER TABLE accounts ADD CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    // NextAuth: sessions FK
    `ALTER TABLE sessions ADD CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    // NextAuth: passkeys FK
    `ALTER TABLE passkeys ADD CONSTRAINT passkeys_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    // Advisor: user_profiles FK
    `ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    // Advisor: personalized_recommendations FK
    `ALTER TABLE personalized_recommendations ADD CONSTRAINT pers_rec_profileId_fkey FOREIGN KEY ("profileId") REFERENCES user_profiles(id) ON DELETE CASCADE`,
    `ALTER TABLE comments ADD CONSTRAINT comments_newsId_fkey FOREIGN KEY ("newsId") REFERENCES news_items(id) ON DELETE CASCADE`,
    `ALTER TABLE comments ADD CONSTRAINT comments_parentId_fkey FOREIGN KEY ("parentId") REFERENCES comments(id) ON DELETE CASCADE`,
  ];
  for (const fkey of fkeys) {
    try {
      await db.$executeRawUnsafe(fkey);
    } catch {
      // Foreign key errors are non-critical (may already exist or table may be empty)
    }
  }

  // ── Add missing columns that may not exist in older deployments ──
  const alterStatements = [
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "isReady" BOOLEAN DEFAULT false`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "sourceName" TEXT DEFAULT ''`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS content TEXT DEFAULT ''`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "contentAr" TEXT DEFAULT ''`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "generatedImage" TEXT`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "processingStage" TEXT DEFAULT 'fetched'`,
    // V118: rejectCount and impactScore columns
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "rejectCount" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "impactScore" INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const stmt of alterStatements) {
    try {
      await db.$executeRawUnsafe(stmt);
    } catch (alterErr: any) {
      // Column already exists — that's fine
      if (!alterErr.message?.includes('already exists') && !alterErr.message?.includes('duplicate')) {
        console.warn('[DB Init] ALTER warning:', alterErr.message?.slice(0, 120));
      }
    }
  }

  // ── Add processingStage index ──
  try {
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_processingStage_idx ON news_items("processingStage")`);
  } catch {}

  // ── Reclassify existing articles into correct processingStage + set isReady based on new rules ──
  // isReady = true ONLY for articles at "imaged" stage (all processing complete)
  // CRITICAL: Also fix articles with NULL processingStage — they were created before
  // the column was added and would NEVER be processed otherwise.

  // 0. FIRST: Set NULL processingStage to 'fetched' so articles enter the pipeline
  try {
    const nullStage = await db.$executeRawUnsafe(`
      UPDATE news_items
      SET "processingStage" = 'fetched'
      WHERE "processingStage" IS NULL
    `);
    if (nullStage > 0) console.log(`[DB Init] ✓ Stage fix: ${nullStage} articles with NULL stage → fetched`);
  } catch (migrateErr: any) {
    console.warn('[DB Init] NULL stage fix warning:', migrateErr.message?.slice(0, 120));
  }

  // ── V37 GOLDEN RULE: NEVER un-publish articles ──
  // isReady=true is IRREVERSIBLE. Once published, an article stays published.
  // The old "TRIPLE SAFETY" code was UNPUBLISHING articles on every server
  // restart, which caused the "articles disappear" bug.
  // V37: We only log warnings for incomplete published articles.
  // The pipeline will re-generate content for unpublished articles.
  try {
    // Log only — DO NOT modify isReady
    const incompletePublished = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM news_items
      WHERE "isReady" = true
        AND (
          ("titleAr" IS NULL OR "titleAr" = '' OR "titleAr" !~ '[\u0600-\u06FF]')
          OR ("contentAr" IS NULL OR "contentAr" = '' OR LENGTH("contentAr") < 200)
          OR ("generatedImage" IS NULL OR "generatedImage" = '' OR LENGTH("generatedImage") < 10)
        )
    `) as any[];
    const count = Number(incompletePublished[0]?.count || 0);
    if (count > 0) {
      console.log(`[DB Init] V37: ${count} published articles have incomplete data (NOT un-publishing — golden rule)`);
    }
  } catch (logErr: any) {
    // Non-critical
  }

  // ── V23: Stage migrations should NOT set isReady=true ──
  // Only pipeline-worker processOneArticleCompletely() sets isReady=true.
  // DB init migration can only update processingStage, NOT isReady.
  // This prevents incomplete articles from being published during server startup.

  try {
    // 1. Articles with generatedImage + real AI analysis + Arabic content → imaged
    // V23: Do NOT set isReady=true here! Pipeline-worker handles publishing.
    const imaged = await db.$executeRawUnsafe(`
      UPDATE news_items
      SET "processingStage" = 'imaged'
      WHERE "isReady" = false
        AND "generatedImage" IS NOT NULL
        AND "aiAnalysis" IS NOT NULL AND LENGTH("aiAnalysis") > 50
        AND "contentAr" IS NOT NULL AND LENGTH("contentAr") > 100
        AND "titleAr" IS NOT NULL AND LENGTH("titleAr") > 3
        AND "titleAr" ~ '[\u0600-\u06FF]'
        AND slug IS NOT NULL
        AND ("processingStage" IS NULL OR "processingStage" NOT IN ('imaged'))
    `);
    if (imaged > 0) console.log(`[DB Init] ✓ Stage migration: ${imaged} articles → imaged (isReady unchanged — pipeline will publish)`);
  } catch (migrateErr: any) {
    console.warn('[DB Init] imaged migration warning:', migrateErr.message?.slice(0, 120));
  }

  try {
    // 2. Articles with real AI analysis + Arabic content but no image → analyzed
    // V20: Only affects UNPUBLISHED articles
    const analyzed = await db.$executeRawUnsafe(`
      UPDATE news_items
      SET "processingStage" = 'analyzed'
      WHERE "isReady" = false
        AND ("generatedImage" IS NULL OR LENGTH("generatedImage") <= 10)
        AND "aiAnalysis" IS NOT NULL AND LENGTH("aiAnalysis") > 50
        AND "contentAr" IS NOT NULL AND LENGTH("contentAr") > 50
        AND "titleAr" IS NOT NULL AND LENGTH("titleAr") > 3
        AND slug IS NOT NULL
        AND ("processingStage" IS NULL OR "processingStage" = 'fetched')
    `);
    if (analyzed > 0) console.log(`[DB Init] ✓ Stage migration: ${analyzed} articles → analyzed`);
  } catch (migrateErr: any) {
    console.warn('[DB Init] analyzed migration warning:', migrateErr.message?.slice(0, 120));
  }

  try {
    // 3. Articles with real Arabic content (> 100 chars) but no AI analysis → translated
    // V20: Only affects UNPUBLISHED articles
    const translated = await db.$executeRawUnsafe(`
      UPDATE news_items
      SET "processingStage" = 'translated'
      WHERE "isReady" = false
        AND ("aiAnalysis" IS NULL OR LENGTH("aiAnalysis") <= 50)
        AND "contentAr" IS NOT NULL AND LENGTH("contentAr") > 100
        AND "titleAr" IS NOT NULL AND LENGTH("titleAr") > 3
        AND slug IS NOT NULL
        AND ("processingStage" IS NULL OR "processingStage" = 'fetched')
    `);
    if (translated > 0) console.log(`[DB Init] ✓ Stage migration: ${translated} articles → translated`);
  } catch (migrateErr: any) {
    console.warn('[DB Init] translated migration warning:', migrateErr.message?.slice(0, 120));
  }

  try {
    // 4. Articles with only titleAr → fetched
    // V20: Only affects UNPUBLISHED articles
    const fetched = await db.$executeRawUnsafe(`
      UPDATE news_items
      SET "processingStage" = 'fetched'
      WHERE "isReady" = false
        AND ("contentAr" IS NULL OR LENGTH("contentAr") <= 100)
        AND ("aiAnalysis" IS NULL OR LENGTH("aiAnalysis") <= 50)
        AND "titleAr" IS NOT NULL AND LENGTH("titleAr") > 3
        AND slug IS NOT NULL
        AND ("processingStage" IS NULL OR "processingStage" = 'fetched')
    `);
    if (fetched > 0) console.log(`[DB Init] ✓ Stage migration: ${fetched} articles → fetched`);
  } catch (migrateErr: any) {
    console.warn('[DB Init] fetched migration warning:', migrateErr.message?.slice(0, 120));
  }

  console.log('[DB Init] ✓ All tables, indexes, and foreign keys created');
}

// ─── Public: Check and create tables if needed (for use in API routes) ──
export async function ensureTablesExist(): Promise<boolean> {
  // If initialized and recently verified, skip re-check
  if (initialized && (Date.now() - lastVerifiedAt) < VERIFY_INTERVAL_MS) {
    return true;
  }

  // If initialized but verification interval expired, re-verify tables exist
  if (initialized) {
    try {
      await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
      lastVerifiedAt = Date.now();
      return true;
    } catch {
      // Tables disappeared! Force re-initialization
      console.warn('[DB Init] ⚠️ Tables missing (were previously verified) — forcing re-initialization...');
      initialized = false;
      initPromise = null;
      lastVerifiedAt = 0;
    }
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    console.error('[DB Init] FATAL: DATABASE_URL is NOT configured correctly. Database queries will be skipped.');
    return false;
  }

  try {
    await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
    initialized = true;
    lastVerifiedAt = Date.now();

    // ── CRITICAL FIX: Always ensure site_settings exists ──
    // site_settings was added after news_items in a schema upgrade.
    // Production DBs that have news_items but not site_settings will
    // have broken locks. This call creates site_settings if missing.
    await ensureSiteSettingsTable();
    await ensureAdsTable();
    await ensureV61Tables();
    await ensureV62Tables();
    await ensureV118Tables();
    await ensureInfographicsTable();
    await ensureV150Tables();
    await ensureVideoReportsTable(); // V318
    // Even if the table exists, it might be missing columns added in newer
    // deployments (e.g., generatedImage). Without these columns, Prisma
    // queries that select all columns will fail with "column does not exist".
    await runMissingColumnMigrations();

    // ── CRITICAL: Fix NULL processingStage ──
    // Articles created before the processingStage column was added have NULL values.
    // These articles would NEVER be found by the process step which queries
    // specific processingStage values. Set them to 'fetched' so they enter the pipeline.
    try {
      const nullStage = await db.$executeRawUnsafe(`
        UPDATE news_items
        SET "processingStage" = 'fetched'
        WHERE "processingStage" IS NULL
      `);
      if (nullStage > 0) console.log(`[DB Init] ✓ Fixed ${nullStage} articles with NULL processingStage → fetched`);
    } catch (stageErr: any) {
      console.warn('[DB Init] NULL stage fix warning:', stageErr.message?.slice(0, 100));
    }

    return true;
  } catch {
    // Table doesn't exist or can't be accessed, try to create it
    try {
      await createAllTablesManually();
      await db.$queryRaw`SELECT 1 FROM news_items LIMIT 1`;
      initialized = true;
      lastVerifiedAt = Date.now();
      console.log('[DB Init] ✓ All tables created on-demand');
      return true;
    } catch (err: any) {
      console.error('[DB Init] On-demand table creation failed:', err.message?.slice(0, 200));
      // Reset initialized flag so we can retry next time
      initialized = false;
      lastVerifiedAt = 0;
      return false;
    }
  }
}

// ─── Run ALTER TABLE migrations for missing columns ──────────────
// This is called even when tables already exist, to ensure all
// columns defined in the Prisma schema are present in the database.
// CRITICAL: Without this, Prisma queries that select all columns
// (like findUnique without a select clause) will fail with
// "column does not exist" errors.
async function runMissingColumnMigrations(): Promise<void> {
  const alterStatements = [
    // V48: Added isPublished — was MISSING from migration list!
    // This caused getNewsFromDB to silently fail (column does not exist)
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT false`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "isReady" BOOLEAN DEFAULT false`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "sourceName" TEXT DEFAULT ''`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS content TEXT DEFAULT ''`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "contentAr" TEXT DEFAULT ''`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "generatedImage" TEXT`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "processingStage" TEXT DEFAULT 'fetched'`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "originalLanguage" TEXT DEFAULT 'en'`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "slug" TEXT`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "aiAnalysis" TEXT`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "affectedAssets" TEXT DEFAULT '[]'`,
    // V5: Added retryCount and lastError columns for pipeline failure tracking
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "lastError" TEXT`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP`,
    // V101: Added impactScore for priority-based article sorting
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "impactScore" INTEGER NOT NULL DEFAULT 0`,
    // V118: Added rejectCount for pipeline rejection tracking
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "rejectCount" INTEGER NOT NULL DEFAULT 0`,
    // V243: Added locale + categoryId for English pipeline (dual-column category system)
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'ar'`,
    `ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "categoryId" TEXT`,
    // V243: locale + categoryId for news_item_archives
    `ALTER TABLE news_item_archives ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'ar'`,
    `ALTER TABLE news_item_archives ADD COLUMN IF NOT EXISTS "categoryId" TEXT`,
    // V243: locale for economic_reports
    `ALTER TABLE economic_reports ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'ar'`,
    // V243: locale for market_analyses
    `ALTER TABLE market_analyses ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'ar'`,
    // V1219: Add source/sourceName to content tables for "محرر رؤى الذكي" badge
    // Sustainable solution — works for all languages (locale-aware in API)
    `ALTER TABLE economic_reports ADD COLUMN IF NOT EXISTS "source" TEXT`,
    `ALTER TABLE economic_reports ADD COLUMN IF NOT EXISTS "sourceName" TEXT`,
    `ALTER TABLE market_analyses ADD COLUMN IF NOT EXISTS "source" TEXT`,
    `ALTER TABLE market_analyses ADD COLUMN IF NOT EXISTS "sourceName" TEXT`,
    `ALTER TABLE market_analyses ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`,
    `ALTER TABLE stock_analyses ADD COLUMN IF NOT EXISTS "source" TEXT`,
    `ALTER TABLE stock_analyses ADD COLUMN IF NOT EXISTS "sourceName" TEXT`,
    `ALTER TABLE reports ADD COLUMN IF NOT EXISTS "source" TEXT`,
    `ALTER TABLE reports ADD COLUMN IF NOT EXISTS "sourceName" TEXT`,
    // V243: locale + categoryId for infographics
    `ALTER TABLE infographics ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'ar'`,
    `ALTER TABLE infographics ADD COLUMN IF NOT EXISTS "categoryId" TEXT`,
    // PR#23: Missing column allowGeneralRecommendations on user_profiles
    // This was omitted from the CREATE TABLE in ensureAdvisorTablesDB() and createAllTablesManually(),
    // causing /api/advisor/profile POST to fail with 500 (Prisma upsert references a column that doesn't exist)
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS "allowGeneralRecommendations" BOOLEAN NOT NULL DEFAULT false`,
  ];
  for (const stmt of alterStatements) {
    try {
      await db.$executeRawUnsafe(stmt);
    } catch (alterErr: any) {
      // Column already exists — that's fine
      if (!alterErr.message?.includes('already exists') && !alterErr.message?.includes('duplicate')) {
        // Non-critical - don't block startup
      }
    }
  }

  // Add processingStage index if missing
  try {
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_processingStage_idx ON news_items("processingStage")`);
  } catch {}
  // V101: Add impactScore index for priority sorting
  try {
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_impactScore_idx ON news_items("impactScore")`);
  } catch {}
  // PR#23: Add missing advisor indexes for personalized_recommendations
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_asset_idx ON personalized_recommendations("asset")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_feedbackType_idx ON personalized_recommendations("feedbackType")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_isSuccessful_idx ON personalized_recommendations("isSuccessful")`); } catch {}
  // V243: Add locale + categoryId indexes for English pipeline
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_locale_idx ON news_items("locale")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_categoryId_idx ON news_items("categoryId")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_url_locale_idx ON news_items(url, "locale")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_isReady_locale_fetchedAt_idx ON news_items("isReady", "locale", "fetchedAt")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_locale_idx ON economic_reports("locale")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS economic_reports_isPublished_locale_publishedAt_idx ON economic_reports("isPublished", "locale", "publishedAt")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS market_analyses_locale_idx ON market_analyses("locale")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_locale_idx ON infographics("locale")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_categoryId_idx ON infographics("categoryId")`); } catch {}
  try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS infographics_isPublished_locale_publishedAt_idx ON infographics("isPublished", "locale", "publishedAt")`); } catch {}

  // ── V256 CRITICAL MIGRATION: Composite unique (slug, locale) ──
  // The Prisma schema declares @@unique([slug, locale]) which means the same slug
  // is allowed in different locales. But the original raw SQL created `slug TEXT UNIQUE`
  // which prevents this. This migration:
  //   1. Drops the old single-column unique constraint on slug
  //   2. Creates the new composite unique index on (slug, locale)
  // This is the ROOT CAUSE of Arabic reports not being saved — the DB rejects
  // Arabic report inserts when an English report already has the same slug.
  const slugLocaleTables = [
    { table: 'economic_reports', key: 'economic_reports_slug_key' },
    { table: 'market_analyses', key: 'market_analyses_slug_key' },
    { table: 'news_item_archives', key: 'news_item_archives_slug_key' },
    { table: 'infographics', key: 'infographics_slug_key' },
  ];
  for (const { table, key } of slugLocaleTables) {
    // Step 1: Drop old single-column unique constraint (if exists)
    try {
      await db.$executeRawUnsafe(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${key}`);
      console.log(`[DB Init V256] Dropped old slug UNIQUE constraint on ${table}`);
    } catch (dropErr: any) {
      // Constraint might not exist or might be named differently — try dropping by index
      if (!dropErr.message?.includes('does not exist')) {
        try {
          await db.$executeRawUnsafe(`DROP INDEX IF EXISTS ${key}`);
        } catch {}
      }
    }
    // Step 2: Create composite unique index (slug, locale) — same slug allowed in different locales
    try {
      await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS ${table}_slug_locale_idx ON ${table}(slug, locale)`);
      console.log(`[DB Init V256] Created composite UNIQUE(slug, locale) index on ${table}`);
    } catch (idxErr: any) {
      if (!idxErr.message?.includes('already exists')) {
        console.warn(`[DB Init V256] Warning: could not create ${table}_slug_locale_idx:`, idxErr.message?.slice(0, 100));
      }
    }
  }
  // Also fix news_items (same issue — slug was TEXT UNIQUE, should be @@unique([slug, locale]))
  try {
    await db.$executeRawUnsafe(`ALTER TABLE news_items DROP CONSTRAINT IF EXISTS news_items_slug_key`);
  } catch {}
  try {
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS news_items_slug_locale_idx ON news_items(slug, locale)`);
  } catch (idxErr: any) {
    if (!idxErr.message?.includes('already exists')) {
      console.warn(`[DB Init V256] Warning: could not create news_items_slug_locale_idx:`, idxErr.message?.slice(0, 100));
    }
  }
}

// ─── V1052: Ensure geopolitical tables exist ──────────────────────
// These tables were defined in schema.prisma but never created via
// migration on Railway. This runs raw CREATE TABLE IF NOT EXISTS.
export async function ensureGeopoliticalTables(): Promise<void> {
  console.log('[DB Init V1052] Ensuring geopolitical_risks table exists...');

  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "geopolitical_risks" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "summary" TEXT NOT NULL DEFAULT '',
        "content" TEXT NOT NULL DEFAULT '',
        "locale" TEXT NOT NULL DEFAULT 'ar',
        "riskCategory" TEXT NOT NULL DEFAULT 'conflict',
        "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
        "riskScore" INTEGER NOT NULL DEFAULT 50,
        "aiGprScore" DOUBLE PRECISION,
        "acledEventCount" INTEGER NOT NULL DEFAULT 0,
        "acledFatalityCount" INTEGER NOT NULL DEFAULT 0,
        "worldBankStability" DOUBLE PRECISION,
        "gdeltTone" DOUBLE PRECISION,
        "affectedRegions" JSONB NOT NULL DEFAULT '[]',
        "affectedCountries" JSONB NOT NULL DEFAULT '[]',
        "affectedAssets" JSONB NOT NULL DEFAULT '[]',
        "scenarios" JSONB,
        "tradeRoutes" JSONB,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "imageUrl" TEXT,
        "sourceUrls" JSONB NOT NULL DEFAULT '[]',
        "isPublished" BOOLEAN NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "geopolitical_risks_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('[DB Init V1052] ✓ geopolitical_risks table ready');

    // Create indexes (IF NOT EXISTS = safe to run repeatedly)
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "geopolitical_risks_riskCategory_locale_idx" ON "geopolitical_risks"("riskCategory", "locale")`,
      `CREATE INDEX IF NOT EXISTS "geopolitical_risks_riskLevel_idx" ON "geopolitical_risks"("riskLevel")`,
      `CREATE INDEX IF NOT EXISTS "geopolitical_risks_publishedAt_idx" ON "geopolitical_risks"("publishedAt")`,
      `CREATE INDEX IF NOT EXISTS "geopolitical_risks_locale_isPublished_publishedAt_idx" ON "geopolitical_risks"("locale", "isPublished", "publishedAt")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "geopolitical_risks_slug_locale_key" ON "geopolitical_risks"("slug", "locale")`,
    ];
    for (const idx of indexes) {
      try { await db.$executeRawUnsafe(idx); } catch {}
    }
  } catch (err: any) {
    console.error('[DB Init V1052] Failed to create geopolitical_risks:', err?.message?.slice(0, 150));
  }

  // Also ensure geopolitical_events table exists (used by ACLED import)
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "geopolitical_events" (
        "id" TEXT NOT NULL,
        "eventId" TEXT NOT NULL,
        "countryCode" TEXT NOT NULL,
        "countryName" TEXT,
        "region" TEXT,
        "eventType" TEXT,
        "eventDate" TIMESTAMP(3) NOT NULL,
        "fatalities" INTEGER NOT NULL DEFAULT 0,
        "actor1" TEXT,
        "actor2" TEXT,
        "notes" TEXT,
        "source" TEXT,
        "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "geopolitical_events_pkey" PRIMARY KEY ("id")
      );
    `);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "geopolitical_events_eventId_key" ON "geopolitical_events"("eventId")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "geopolitical_events_countryCode_idx" ON "geopolitical_events"("countryCode")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "geopolitical_events_eventDate_idx" ON "geopolitical_events"("eventDate")`);
    console.log('[DB Init V1052] ✓ geopolitical_events table ready');
  } catch (err: any) {
    console.error('[DB Init V1052] Failed to create geopolitical_events:', err?.message?.slice(0, 150));
  }
}

// ─── Force re-initialization of DB schema (resets all flags) ──
// Superset of resetDBInit() — also resets lastVerifiedAt so the next
// ensureTablesExist() call will re-verify tables exist.
export function forceReinitDB(): void {
  initialized = false;
  initPromise = null;
  lastVerifiedAt = 0;
}

// ─── Reset the initialized flag (e.g., after a DB connection error) ──
export function resetDBInit(): void {
  initialized = false;
  initPromise = null;
}
