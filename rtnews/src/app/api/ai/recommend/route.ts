// ─── V68 AI Article Recommendation Endpoint ─────────────────
// Implements the 4-gate recommendation pipeline for article curation.
// Gates: Relevance → Quality → Sentiment → Priority
// Supports single article and batch recommendation.

import { NextRequest, NextResponse } from 'next/server';
import { runRecommendationPipeline, batchRecommend } from '@/lib/ai/ai-router';

export const dynamic = 'force-dynamic';

// Rate limiting
let lastRecommendCall = 0;
const RECOMMEND_COOLDOWN_MS = 5_000; // 5 seconds between calls

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const now = Date.now();
    if (now - lastRecommendCall < RECOMMEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((RECOMMEND_COOLDOWN_MS - (now - lastRecommendCall)) / 1000);
      return NextResponse.json({
        status: 'rate_limited',
        message: `Please wait ${waitSecs} seconds between recommendation calls`,
        retryAfter: waitSecs,
      }, { status: 429 });
    }
    lastRecommendCall = now;

    const body = await request.json();
    const { title, content, articleId, articles } = body as {
      title?: string;
      content?: string;
      articleId?: string;
      articles?: Array<{ id: string; title: string; content: string }>;
    };

    // Batch mode: multiple articles
    if (articles && Array.isArray(articles) && articles.length > 0) {
      // Limit batch size to prevent abuse
      const batch = articles.slice(0, 10);
      const results = await batchRecommend(batch);

      return NextResponse.json({
        version: 'V68',
        mode: 'batch',
        totalProcessed: results.length,
        recommended: results.filter(r => r.recommended).length,
        results,
        timestamp: new Date().toISOString(),
      });
    }

    // Single article mode
    if (!title || !content) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing required fields: title and content (or articles array for batch mode)',
        example: {
          single: { title: 'Article title', content: 'Article content', articleId: 'optional-id' },
          batch: { articles: [{ id: '1', title: 'Title', content: 'Content' }] },
        },
      }, { status: 400 });
    }

    const result = await runRecommendationPipeline(title, content, articleId);

    return NextResponse.json({
      version: 'V68',
      mode: 'single',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Recommend] Error:', error.message);
    return NextResponse.json({
      version: 'V68',
      status: 'error',
      error: 'فشل في معالجة التوصية',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// GET: Return pipeline info and usage instructions
export async function GET() {
  return NextResponse.json({
    version: 'V68',
    endpoint: '/api/ai/recommend',
    method: 'POST',
    description: '4-gate article recommendation pipeline',
    gates: [
      {
        name: 'relevance',
        description: 'Checks if the article is relevant to trading/markets',
        passThreshold: 40,
      },
      {
        name: 'quality',
        description: 'Evaluates content quality (not spam/duplicate)',
        passThreshold: 50,
      },
      {
        name: 'sentiment',
        description: 'Analyzes market sentiment (bullish/bearish/neutral/mixed)',
        passThreshold: 0, // Always passes — informational
      },
      {
        name: 'priority',
        description: 'Determines priority level (urgent/important/normal/low)',
        passThreshold: 30,
      },
    ],
    usage: {
      single: {
        method: 'POST',
        body: {
          title: 'Article title (required)',
          content: 'Article content (required)',
          articleId: 'Optional article ID',
        },
      },
      batch: {
        method: 'POST',
        body: {
          articles: [
            { id: '1', title: 'Title 1', content: 'Content 1' },
            { id: '2', title: 'Title 2', content: 'Content 2' },
          ],
        },
        maxBatchSize: 10,
      },
    },
    timestamp: new Date().toISOString(),
  });
}
