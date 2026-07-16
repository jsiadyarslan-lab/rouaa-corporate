// ─── News Source Test Endpoint ────────────────────────────────
// Tests each news source individually and returns the results.
// This helps diagnose why the pipeline might be fetching 0 items.
// Access: GET /api/news/diag-db-url

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    dbUrlInfo: null,
    db: null,
    tables: null,
    testWrite: null,
  };

  // Test 0: Show DATABASE_URL info (mask password)
  try {
    const url = process.env.DATABASE_URL || 'NOT SET';
    const maskedUrl = url.replace(/:([^@]+)@/, ':****@');
    const port = url.match(/:(\d+)\//)?.[1] || 'unknown';
    const host = url.match(/@([^:]+):/)?.[1] || 'unknown';
    const isPooler = url.includes('pooler');
    const isRailway = url.includes('railway.internal');
    results.dbUrlInfo = { maskedUrl, port, host, isPooler, isRailway, urlLength: url.length };
  } catch {}

  // Test 1: Can we connect to the DB?
  try {
    const count = await db.newsItem.count();
    results.db = { ok: true, count };
  } catch (err: any) {
    results.db = { ok: false, error: err.message?.slice(0, 200) };
  }

  // Test 2: Do tables exist?
  try {
    const ok = await ensureTablesExist();
    results.tables = { ok };
  } catch (err: any) {
    results.tables = { ok: false, error: err.message };
  }

  // Test 3: Can we write to the DB?
  try {
    // Try to create a test article and then delete it
    const testId = `test-${Date.now()}`;
    await db.newsItem.create({
      data: {
        id: testId,
        title: 'TEST ARTICLE - DELETE ME',
        summary: 'Test',
        url: `https://test.example.com/${Date.now()}`,
        source: 'test',
        category: 'test',
        sentiment: 'neutral',
        sentimentScore: 50,
        impactLevel: 'low',
        originalLanguage: 'en',
        newsType: 'live',
        affectedAssets: '[]',
        isPublished: false,
        processingStage: 'fetched',
        slug: `test-${Date.now()}`,
        fetchedAt: new Date(),
      },
    });
    // Read it back
    const readBack = await db.newsItem.findUnique({ where: { id: testId } });
    // Delete it
    await db.newsItem.delete({ where: { id: testId } });
    results.testWrite = { ok: true, readBack: !!readBack };
  } catch (err: any) {
    results.testWrite = { ok: false, error: err.message, stack: err.stack?.slice(0, 300) };
  }

  return NextResponse.json(results);
}
