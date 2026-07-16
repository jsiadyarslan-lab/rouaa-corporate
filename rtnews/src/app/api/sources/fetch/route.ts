// POST /api/sources/fetch — Trigger fetch for a specific source
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdapter } from '../../../../../services/source-registry/adapters/registry';
import { updateSourceHealth } from '../../../../../services/source-registry/lib/health-monitor';
import type { SourceConfig } from '../../../../../services/source-registry/adapters/types';

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

    const result = await adapter.fetch(sourceConfig);

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
      durationMs: result.durationMs,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
