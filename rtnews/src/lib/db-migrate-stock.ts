// ─── Database Migration Helper ──────────────────────────────
// Ensures stock_analyses and company_profiles tables exist
// AND that they have all required columns.
// SAFE V3: Creates tables if missing, ALTERs tables to add
// missing columns (if table exists with old schema).
// NEVER drops tables, NEVER uses prisma db push.
//
// CRITICAL FIX HISTORY:
// V1: Used `prisma db push --accept-data-loss` which destroyed production.
// V2: Only created tables if missing — didn't handle old schema.
// V3: Creates tables + adds missing columns via ALTER TABLE.

import { db } from '@/lib/db';

let migrationAttempted = false;
let migrationSuccess = false;
let migrationAttemptTime = 0;
// Cooldown before allowing a retry: 30 seconds (transient errors like connection pool
// exhaustion or Supabase cold start should resolve quickly)
const MIGRATION_RETRY_COOLDOWN_MS = 30_000;

/**
 * Safely add a column to a table if it doesn't already exist.
 * Uses PostgreSQL information_schema to check first.
 */
async function addColumnIfNotExists(
  table: string,
  column: string,
  type: string,
  defaultVal?: string
): Promise<void> {
  const exists = await db.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = '${table}' AND column_name = '${column}'
    LIMIT 1;
  `);
  if (Array.isArray(exists) && exists.length > 0) return;

  const sql = defaultVal
    ? `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type} DEFAULT ${defaultVal};`
    : `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type};`;
  await db.$executeRawUnsafe(sql);
  console.log(`[StockMigration] Added column ${table}.${column}`);
}

export async function ensureStockTablesExist(): Promise<boolean> {
  if (migrationSuccess) return true;
  // Allow retry after cooldown so transient failures (cold start, pool exhaustion)
  // don't permanently block ALL requests until server restart
  if (migrationAttempted) {
    const elapsed = Date.now() - migrationAttemptTime;
    if (elapsed < MIGRATION_RETRY_COOLDOWN_MS) {
      return false;
    }
    // Cooldown elapsed — allow one more attempt
    console.log(`[StockMigration] Retry cooldown elapsed (${Math.round(elapsed / 1000)}s) — attempting migration again...`);
  }

  migrationAttempted = true;
  migrationAttemptTime = Date.now();

  try {
    // Quick check: try a simple count query
    await db.stockAnalysis.count();
    console.log('[StockMigration] Tables already exist — checking schema...');

    // Even if tables exist, they may be missing columns (old schema).
    // Run ALTER TABLE for any missing columns.
    await migrateExistingTables();
    migrationSuccess = true;
    return true;
  } catch (err: any) {
    const errMsg = err?.message || '';
    // Distinguish between "table doesn't exist" and connection errors
    const isTableMissing =
      errMsg.includes('does not exist') ||
      errMsg.includes('relation') && errMsg.includes('not found') ||
      errMsg.includes('no such table');

    if (!isTableMissing) {
      // This could be a schema mismatch (old table missing columns).
      // Try migration anyway — the ALTER TABLE approach handles this.
      console.log('[StockMigration] Table exists but query failed — trying schema migration...');
      try {
        await migrateExistingTables();
        // Verify after migration
        await db.stockAnalysis.count();
        console.log('[StockMigration] ✓ Schema migration successful');
        migrationSuccess = true;
        return true;
      } catch (migErr: any) {
        console.error('[StockMigration] Migration also failed:', migErr.message?.slice(0, 200));
        return false;
      }
    }

    console.log('[StockMigration] Tables missing, attempting safe creation (NO drops, NO prisma db push)...');
  }

  // SAFE: Create tables with raw SQL — WITHOUT dropping first
  try {
    // Create company_profiles if not exists
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "company_profiles" (
        "id" TEXT NOT NULL,
        "symbol" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "nameAr" TEXT,
        "nameFr" TEXT,
        "exchange" TEXT,
        "sector" TEXT,
        "industry" TEXT,
        "description" TEXT,
        "descriptionAr" TEXT,
        "descriptionFr" TEXT,
        "marketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "peRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "eps" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "dividendYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "beta" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "ceo" TEXT,
        "country" TEXT,
        "logoUrl" TEXT,
        "website" TEXT,
        "employees" INTEGER,
        "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
      );
    `);

    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "company_profiles_symbol_key" ON "company_profiles"("symbol");`).catch(() => {});
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "company_profiles_sector_idx" ON "company_profiles"("sector");`).catch(() => {});
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "company_profiles_exchange_idx" ON "company_profiles"("exchange");`).catch(() => {});
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "company_profiles_marketCap_idx" ON "company_profiles"("marketCap");`).catch(() => {});

    // Create stock_analyses if not exists
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "stock_analyses" (
        "id" TEXT NOT NULL,
        "symbol" TEXT NOT NULL,
        "slug" TEXT NOT NULL DEFAULT '',
        "locale" TEXT NOT NULL DEFAULT 'en',
        "title" TEXT NOT NULL DEFAULT '',
        "summary" TEXT NOT NULL DEFAULT '',
        "content" TEXT NOT NULL DEFAULT '',
        "analysisType" TEXT NOT NULL DEFAULT 'daily',
        "priceAtAnalysis" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "change" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "changePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "high" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "low" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "open" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "volume" INTEGER NOT NULL DEFAULT 0,
        "previousClose" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "priceTarget" DOUBLE PRECISION,
        "stopLoss" DOUBLE PRECISION,
        "riskLevel" TEXT NOT NULL DEFAULT 'medium',
        "sentiment" TEXT NOT NULL DEFAULT 'neutral',
        "overallSignal" TEXT NOT NULL DEFAULT 'neutral',
        "overallScore" INTEGER NOT NULL DEFAULT 0,
        "confidenceScore" INTEGER NOT NULL DEFAULT 50,
        "technicalScore" INTEGER NOT NULL DEFAULT 0,
        "fundamentalScore" INTEGER NOT NULL DEFAULT 0,
        "sector" TEXT,
        "marketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "peRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "eps" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "marketType" TEXT NOT NULL DEFAULT 'sp500',
        "assetClass" TEXT NOT NULL DEFAULT 'stocks',
        "keyMetrics" TEXT NOT NULL DEFAULT '{}',
        "indicators" TEXT NOT NULL DEFAULT '{}',
        "technicalData" TEXT NOT NULL DEFAULT '{}',
        "tradeSetup" TEXT NOT NULL DEFAULT '{}',
        "sourceUrls" TEXT NOT NULL DEFAULT '[]',
        "relatedNewsIds" TEXT NOT NULL DEFAULT '[]',
        "relatedReportIds" TEXT NOT NULL DEFAULT '[]',
        "newsItemId" TEXT,
        "imageUrl" TEXT,
        "isPublished" BOOLEAN NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP(3),
        "validUntil" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        CONSTRAINT "stock_analyses_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes (IF NOT EXISTS — safe)
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "stock_analyses_slug_locale_key" ON "stock_analyses"("slug", "locale");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_symbol_locale_idx" ON "stock_analyses"("symbol", "locale");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_analysisType_createdAt_idx" ON "stock_analyses"("analysisType", "createdAt");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_isPublished_locale_publishedAt_idx" ON "stock_analyses"("isPublished", "locale", "publishedAt");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_sector_idx" ON "stock_analyses"("sector");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_confidenceScore_idx" ON "stock_analyses"("confidenceScore");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_sentiment_idx" ON "stock_analyses"("sentiment");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_overallSignal_idx" ON "stock_analyses"("overallSignal");`,
      `CREATE INDEX IF NOT EXISTS "stock_analyses_marketType_idx" ON "stock_analyses"("marketType");`,
    ];

    for (const sql of indexes) {
      await db.$executeRawUnsafe(sql).catch(() => {});
    }

    // Add foreign key (safe — IF NOT EXISTS via try/catch)
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "stock_analyses"
        ADD CONSTRAINT "stock_analyses_symbol_fkey"
        FOREIGN KEY ("symbol") REFERENCES "company_profiles"("symbol")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {
      // Constraint may already exist — that's fine
    }

    // Also run column migration for existing tables
    await migrateExistingTables();

    // Verify tables are accessible
    await db.stockAnalysis.count();
    console.log('[StockMigration] ✓ Stock analysis tables verified successfully');
    migrationSuccess = true;
    return true;
  } catch (err: any) {
    console.error('[StockMigration] Failed to create tables:', err.message?.slice(0, 300));
    return false;
  }
}

/**
 * Migrate existing tables by adding missing columns.
 * This handles the case where the table was created with an old schema
 * and is missing columns that the current Prisma schema expects.
 * Each ALTER TABLE uses IF NOT EXISTS — safe to run repeatedly.
 */
async function migrateExistingTables(): Promise<void> {
  console.log('[StockMigration] Checking for missing columns...');

  // ── stock_analyses columns ──
  // These are the columns the pipeline code expects but old tables may lack
  const stockColumns: [string, string, string?][] = [
    ['slug', 'TEXT', `''`],
    ['locale', 'TEXT', `'en'`],
    ['title', 'TEXT', `''`],
    ['summary', 'TEXT', `''`],
    ['content', 'TEXT', `''`],
    ['analysisType', 'TEXT', `'daily'`],
    ['priceAtAnalysis', 'DOUBLE PRECISION', '0'],
    ['price', 'DOUBLE PRECISION', '0'],
    ['change', 'DOUBLE PRECISION', '0'],
    ['changePercent', 'DOUBLE PRECISION', '0'],
    ['high', 'DOUBLE PRECISION', '0'],
    ['low', 'DOUBLE PRECISION', '0'],
    ['open', 'DOUBLE PRECISION', '0'],
    ['volume', 'INTEGER', '0'],
    ['previousClose', 'DOUBLE PRECISION', '0'],
    ['priceTarget', 'DOUBLE PRECISION'],
    ['stopLoss', 'DOUBLE PRECISION'],
    ['riskLevel', 'TEXT', `'medium'`],
    ['sentiment', 'TEXT', `'neutral'`],
    ['overallSignal', 'TEXT', `'neutral'`],
    ['overallScore', 'INTEGER', '0'],
    ['confidenceScore', 'INTEGER', '50'],
    ['technicalScore', 'INTEGER', '0'],
    ['fundamentalScore', 'INTEGER', '0'],
    ['sector', 'TEXT'],
    ['marketCap', 'DOUBLE PRECISION', '0'],
    ['peRatio', 'DOUBLE PRECISION', '0'],
    ['eps', 'DOUBLE PRECISION', '0'],
    ['marketType', 'TEXT', `'sp500'`],
    ['assetClass', 'TEXT', `'stocks'`],
    ['keyMetrics', 'TEXT', `'{}'`],
    ['indicators', 'TEXT', `'{}'`],
    ['technicalData', 'TEXT', `'{}'`],
    ['tradeSetup', 'TEXT', `'{}'`],
    ['sourceUrls', 'TEXT', `'[]'`],
    ['relatedNewsIds', 'TEXT', `'[]'`],
    ['relatedReportIds', 'TEXT', `'[]'`],
    ['newsItemId', 'TEXT'],
    ['imageUrl', 'TEXT'],
    ['isPublished', 'BOOLEAN', 'false'],
    ['publishedAt', 'TIMESTAMP(3)'],
    ['validUntil', 'TIMESTAMP(3)'],
    ['createdAt', 'TIMESTAMP(3)', 'NOW()'],
    ['updatedAt', 'TIMESTAMP(3)', 'NOW()'],
  ];

  for (const [col, type, def] of stockColumns) {
    try {
      await addColumnIfNotExists('stock_analyses', col, type, def);
    } catch {
      // Column may already exist or other non-critical error
    }
  }

  // ── company_profiles columns ──
  const companyColumns: [string, string, string?][] = [
    ['id', 'TEXT', `''`],
    ['symbol', 'TEXT', `''`],
    ['name', 'TEXT', `''`],
    ['nameAr', 'TEXT'],
    ['nameFr', 'TEXT'],
    ['exchange', 'TEXT'],
    ['sector', 'TEXT'],
    ['industry', 'TEXT'],
    ['description', 'TEXT'],
    ['descriptionAr', 'TEXT'],
    ['descriptionFr', 'TEXT'],
    ['marketCap', 'DOUBLE PRECISION', '0'],
    ['peRatio', 'DOUBLE PRECISION', '0'],
    ['eps', 'DOUBLE PRECISION', '0'],
    ['dividendYield', 'DOUBLE PRECISION', '0'],
    ['beta', 'DOUBLE PRECISION', '0'],
    ['ceo', 'TEXT'],
    ['country', 'TEXT'],
    ['logoUrl', 'TEXT'],
    ['website', 'TEXT'],
    ['employees', 'INTEGER'],
    ['lastUpdated', 'TIMESTAMP(3)', 'NOW()'],
    ['createdAt', 'TIMESTAMP(3)', 'NOW()'],
    ['updatedAt', 'TIMESTAMP(3)', 'NOW()'],
  ];

  for (const [col, type, def] of companyColumns) {
    try {
      await addColumnIfNotExists('company_profiles', col, type, def);
    } catch {
      // Column may already exist or other non-critical error
    }
  }

  // ── Create indexes (safe — IF NOT EXISTS) ──
  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "stock_analyses_slug_locale_key" ON "stock_analyses"("slug", "locale");`,
    `CREATE INDEX IF NOT EXISTS "stock_analyses_symbol_locale_idx" ON "stock_analyses"("symbol", "locale");`,
    `CREATE INDEX IF NOT EXISTS "stock_analyses_isPublished_locale_publishedAt_idx" ON "stock_analyses"("isPublished", "locale", "publishedAt");`,
    `CREATE INDEX IF NOT EXISTS "stock_analyses_sector_idx" ON "stock_analyses"("sector");`,
    `CREATE INDEX IF NOT EXISTS "stock_analyses_overallSignal_idx" ON "stock_analyses"("overallSignal");`,
    `CREATE INDEX IF NOT EXISTS "stock_analyses_marketType_idx" ON "stock_analyses"("marketType");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "company_profiles_symbol_key" ON "company_profiles"("symbol");`,
  ];

  for (const sql of indexes) {
    await db.$executeRawUnsafe(sql).catch(() => {});
  }

  // ── Add foreign key (safe — try/catch) ──
  try {
    await db.$executeRawUnsafe(`
      ALTER TABLE "stock_analyses"
      ADD CONSTRAINT "stock_analyses_symbol_fkey"
      FOREIGN KEY ("symbol") REFERENCES "company_profiles"("symbol")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  } catch {
    // Constraint may already exist
  }

  // V1050: Add isOfficialSource to news_items table
  try {
    await addColumnIfNotExists('news_items', 'isOfficialSource', 'BOOLEAN', 'false');
    console.log('[StockMigration] V1050: isOfficialSource column check done');
  } catch {
    // Column may already exist or other non-critical error
  }

  console.log('[StockMigration] ✓ Column migration check completed');
}
