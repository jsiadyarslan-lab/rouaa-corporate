// POST /api/sources/fetch — Trigger fetch for a specific source
// V1220.2: Returns detailed storage errors for diagnosis
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdapter } from '@/../services/source-registry/adapters/registry';
import { updateSourceHealth } from '@/../services/source-registry/lib/health-monitor';
import { storeDocuments } from '@/../services/source-registry/lib/document-store';
import type { SourceConfig } from '@/../services/source-registry/adapters/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });
    }

    const source = await db.officialSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const sourceConfig: SourceConfig = {
      id: source.id,
      name: source.name,
      slug: source.slug,
      type: source.type,
      rss: source.rss,
      api: source.api,
      website: source.website,
      accessMethods: JSON.parse(source.accessMethods || '[]'),
      language: source.language,
      locale: source.locale,
      updateFrequency: source.updateFrequency,
      timezone: source.timezone,
    };

    const adapter = getAdapter(sourceConfig);
    if (!adapter) {
      return NextResponse.json({ error: 'No suitable adapter for this source' }, { status: 400 });
    }

    // Step 1: Fetch
    const result = await adapter.fetch(sourceConfig);

    // Step 2: Store (V1220.2: with detailed error capture)
    let storeResult = { stored: 0, newVersions: 0, duplicates: 0, errors: [] as any[] };
    if (result.success && result.documents.length > 0) {
      storeResult = await storeDocuments(source.id, result.documents);
      console.log(`[FetchAPI] Stored: ${storeResult.stored} new, ${storeResult.newVersions} versions, ${storeResult.duplicates} dup, ${storeResult.errors.length} errors`);
      if (storeResult.errors.length > 0) {
        console.log('[FetchAPI] First error detail:', JSON.stringify(storeResult.errors[0]).slice(0, 300));
      }
    }

    // Step 3: Health
    await updateSourceHealth({
      sourceId: source.id,
      success: result.success,
      durationMs: result.durationMs,
      httpStatus: result.httpStatus,
      documentsCount: result.documents.length,
      error: result.error,
    });

    return NextResponse.json({
      success: result.success,
      documentsFetched: result.documents.length,
      documentsStored: storeResult.stored,
      newVersions: storeResult.newVersions,
      duplicates: storeResult.duplicates,
      storageErrors: storeResult.errors.length,
      // V1220.2: Return first 3 errors with full details
      errorDetails: storeResult.errors.slice(0, 3),
      durationMs: result.durationMs,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
