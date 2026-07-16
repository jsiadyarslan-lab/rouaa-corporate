// V130f: Debug route to test module imports
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Admin-only endpoint
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, string> = {};
  
  // Test 1: Import db
  try {
    const { db } = await import('@/lib/db');
    results['db'] = db ? 'OK (has db)' : 'FAIL (db is null)';
  } catch (err: any) {
    results['db'] = 'ERROR';
  }
  
  // Test 2: Import news-sources
  try {
    const ns = await import('@/lib/news-sources');
    results['news-sources'] = ns.getNewsFromDB ? 'OK (has getNewsFromDB)' : 'FAIL (missing getNewsFromDB)';
  } catch (err: any) {
    results['news-sources'] = 'ERROR';
  }
  
  // Test 3: Import ai-provider
  try {
    const ai = await import('@/lib/ai-provider');
    results['ai-provider'] = ai.translateToArabic ? 'OK' : 'FAIL (missing translateToArabic)';
  } catch (err: any) {
    results['ai-provider'] = 'ERROR';
  }
  
  // Test 4: Import AWS SDK
  try {
    const aws = await import('@aws-sdk/client-bedrock-runtime');
    results['aws-sdk'] = aws.BedrockRuntimeClient ? 'OK' : 'FAIL (missing BedrockRuntimeClient)';
  } catch (err: any) {
    results['aws-sdk'] = 'ERROR';
  }
  
  // Test 5: DB query
  try {
    const { db } = await import('@/lib/db');
    const count = await db.newsItem.count({ where: { isReady: true, isPublished: true } });
    results['db-query'] = `OK (count=${count})`;
  } catch (err: any) {
    results['db-query'] = 'ERROR';
  }
  
  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}
