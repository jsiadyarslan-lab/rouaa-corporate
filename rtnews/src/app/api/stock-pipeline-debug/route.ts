// Debug endpoint to test stock pipeline components individually
import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getHistoricalData, getApiStatus } from '@/lib/financial-apis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Admin-only endpoint
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  const step = searchParams.get('step') || 'all';

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    symbol,
    apiStatus: getApiStatus(),
  };

  try {
    if (step === 'all' || step === 'quote') {
      const quoteStart = Date.now();
      const quote = await getQuote(symbol);
      results.quote = quote ? {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.changePercent,
        volume: quote.volume,
      } : null;
      results.quoteTime = `${Date.now() - quoteStart}ms`;
    }

    if (step === 'all' || step === 'history') {
      const histStart = Date.now();
      const history = await getHistoricalData(symbol, 90);
      results.history = {
        points: history?.length || 0,
        firstDate: history?.[0]?.date || null,
        lastDate: history?.[history.length - 1]?.date || null,
      };
      results.historyTime = `${Date.now() - histStart}ms`;
    }

    if (step === 'all' || step === 'ai') {
      try {
        const { chatCompletion } = await import('@/lib/ai-provider');
        const aiStart = Date.now();
        const aiResult = await chatCompletion([
          { role: 'user', content: `Say "OK" if you can hear me.` }
        ], { temperature: 0, maxTokens: 10 });
        results.ai = {
          working: true,
          response: aiResult.content?.slice(0, 50),
          time: `${Date.now() - aiStart}ms`,
        };
      } catch (err: any) {
        results.ai = { working: false };
      }
    }

    if (step === 'all' || step === 'db') {
      try {
        const { db } = await import('@/lib/db');
        const dbStart = Date.now();
        const count = await db.stockAnalysis.count();
        results.db = {
          working: true,
          analysisCount: count,
          time: `${Date.now() - dbStart}ms`,
        };
      } catch (err: any) {
        results.db = { working: false };
      }
    }
  } catch (err: any) {
    console.error('[stock-pipeline-debug] Error:', err);
    results.error = 'Internal error';
  }

  return NextResponse.json(results);
}
