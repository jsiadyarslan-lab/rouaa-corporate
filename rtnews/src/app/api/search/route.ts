// ─── Search API (redirects to semantic search) ────────────────
// The old per-article LLM embedding approach was too slow (50+ LLM calls).
// This route now delegates to the optimized semantic search API.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const limit = url.searchParams.get('limit') || '10';
    const locale = url.searchParams.get('locale') || '';
    const minScore = url.searchParams.get('minScore') || '0.3';

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Delegate to the optimized semantic search endpoint
    const semanticUrl = new URL('/api/search/semantic', url.origin);
    semanticUrl.searchParams.set('q', q);
    semanticUrl.searchParams.set('limit', limit);
    semanticUrl.searchParams.set('minScore', minScore);
    if (locale) semanticUrl.searchParams.set('locale', locale);

    const res = await fetch(semanticUrl.toString());
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Search API] Error:', error.message);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
