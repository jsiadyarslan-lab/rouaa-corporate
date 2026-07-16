// POST /api/sources/debug-store — Debug document storage errors
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sourceId } = body;

  const results: any = {
    sourceId,
    steps: [],
  };

  // Step 1: Check if source exists
  try {
    const source = await db.officialSource.findUnique({ where: { id: sourceId } });
    if (!source) {
      results.steps.push({ step: 'find_source', error: 'Source not found' });
      return NextResponse.json(results);
    }
    results.steps.push({ step: 'find_source', success: true, name: source.name });
  } catch (e: any) {
    results.steps.push({ step: 'find_source', error: e.message });
    return NextResponse.json(results);
  }

  // Step 2: Try to create a test document
  try {
    const testHash = createHash('sha256').update('test-document-content').digest('hex');
    const doc = await db.officialDocument.create({
      data: {
        sourceId,
        url: 'https://test.example.com/debug-doc',
        documentType: 'html',
        title: 'Debug Test Document',
        rawContent: 'This is a test document for debugging storage issues.',
        hash: testHash,
        language: 'en',
        version: 1,
        isLatest: true,
        contentLength: 48,
        httpStatus: 200,
        metadata: '{}',
      },
    });
    results.steps.push({ step: 'create_document', success: true, id: doc.id });

    // Step 3: Try to retrieve it
    const retrieved = await db.officialDocument.findFirst({
      where: { sourceId, isLatest: true },
    });
    results.steps.push({ step: 'retrieve_document', success: !!retrieved, found: !!retrieved });

    // Step 4: Clean up
    await db.officialDocument.delete({ where: { id: doc.id } });
    results.steps.push({ step: 'cleanup', success: true });
  } catch (e: any) {
    results.steps.push({ step: 'create_document', error: e.message, code: e.code, meta: e.meta });
  }

  // Step 5: Check table structure
  try {
    const count = await db.officialDocument.count();
    results.steps.push({ step: 'count_documents', success: true, count });
  } catch (e: any) {
    results.steps.push({ step: 'count_documents', error: e.message, code: e.code });
  }

  return NextResponse.json(results);
}
