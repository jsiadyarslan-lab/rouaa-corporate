// GET /api/sources/diagnose — Direct database diagnostics
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any = { tests: [] };

  // Test 1: Can we query OfficialSource?
  try {
    const count = await db.officialSource.count();
    results.tests.push({ test: 'officialSource.count', success: true, count });
  } catch (e: any) {
    results.tests.push({ test: 'officialSource.count', error: e.message, code: e.code });
  }

  // Test 2: Can we query OfficialDocument?
  try {
    const count = await db.officialDocument.count();
    results.tests.push({ test: 'officialDocument.count', success: true, count });
  } catch (e: any) {
    results.tests.push({ test: 'officialDocument.count', error: e.message, code: e.code });
  }

  // Test 3: Try to create a test document
  try {
    const sources = await db.officialSource.findMany({ take: 1 });
    if (sources.length > 0) {
      const sourceId = sources[0].id;
      const doc = await db.officialDocument.create({
        data: {
          sourceId,
          url: 'https://diagnostic.test/example',
          documentType: 'html',
          title: 'Diagnostic Test',
          rawContent: 'test content',
          hash: 'a'.repeat(64),
          language: 'en',
          version: 1,
          isLatest: true,
          contentLength: 12,
          httpStatus: 200,
          metadata: '{}',
        },
      });
      results.tests.push({ test: 'officialDocument.create', success: true, id: doc.id });
      await db.officialDocument.delete({ where: { id: doc.id } });
      results.tests.push({ test: 'officialDocument.delete', success: true });
    } else {
      results.tests.push({ test: 'officialDocument.create', error: 'No sources found' });
    }
  } catch (e: any) {
    results.tests.push({ 
      test: 'officialDocument.create', 
      error: e.message, 
      code: e.code,
      meta: e.meta ? JSON.stringify(e.meta).slice(0, 500) : undefined,
    });
  }

  // Test 4: Check if db.officialDocument exists
  results.tests.push({ 
    test: 'db.officialDocument exists', 
    success: typeof (db as any).officialDocument !== 'undefined',
    type: typeof (db as any).officialDocument,
  });

  return NextResponse.json(results);
}
