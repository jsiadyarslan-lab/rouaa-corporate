// ─── SWOT Analysis API Endpoint ─────────────────────────────────
// POST /api/stock-analysis/[symbol]/swot  — Generate SWOT analysis (with cache check)
// GET  /api/stock-analysis/[symbol]/swot  — Fetch cached SWOT analysis
// Uses AI to generate SWOT from FMP stock data, cached for 24 hours.

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/ai-provider';
import { db } from '@/lib/db';
import { getStockQuote, getKeyMetrics as getFmpKeyMetrics, getStockRating } from '@/lib/fmp-api';

export const dynamic = 'force-dynamic';

// In-memory cache (24h TTL)
const swotCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── GET: Return cached SWOT analysis ─────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const cacheKey = `${symbol}-${locale}`;
    const cached = swotCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ status: 'ok', source: 'cache', ...cached.data });
    }

    // No cached data available
    return NextResponse.json({
      status: 'ok',
      source: 'none',
      symbol,
      locale,
      swot: null,
      generatedAt: null,
    });
  } catch (err: any) {
    console.error('[SWOT API GET] Error:', err.message);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
}

// ─── POST: Generate SWOT analysis (with cache check) ─────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check cache first — if fresh, return immediately
    const cacheKey = `${symbol}-${locale}`;
    const cached = swotCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ status: 'ok', source: 'cache', ...cached.data });
    }

    // Fetch stock data for the prompt
    const [fmpQuote, fmpKeyMetrics, fmpRating] = await Promise.allSettled([
      getStockQuote(symbol),
      getFmpKeyMetrics(symbol),
      getStockRating(symbol),
    ]);

    const quote = fmpQuote.status === 'fulfilled' ? fmpQuote.value : null;
    const keyMetrics = fmpKeyMetrics.status === 'fulfilled' ? fmpKeyMetrics.value : null;
    const rating = fmpRating.status === 'fulfilled' ? fmpRating.value : null;

    // Also get company from DB
    const company = await db.companyProfile.findUnique({
      where: { symbol },
      select: {
        name: true,
        sector: true,
        industry: true,
        peRatio: true,
        eps: true,
        dividendYield: true,
        marketCap: true,
      },
    });

    // Build context for AI
    const context = `
Stock: ${symbol} - ${company?.name || symbol}
Sector: ${company?.sector || 'N/A'}, Industry: ${company?.industry || 'N/A'}
Current Price: $${quote?.price || 'N/A'}
P/E Ratio: ${company?.peRatio || keyMetrics?.per || 'N/A'}
EPS: ${company?.eps || quote?.eps || 'N/A'}
Dividend Yield: ${company?.dividendYield || 'N/A'}%
Market Cap: ${company?.marketCap ? `$${company.marketCap}B` : 'N/A'}
Analyst Rating: ${rating?.ratingRecommendation || rating?.rating || 'N/A'}
DCF Fair Value: ${rating?.dcf || 'N/A'}
ROE: ${keyMetrics?.roe || 'N/A'}%
ROA: ${keyMetrics?.roa || 'N/A'}%
Beta: N/A
Debt/Equity: ${keyMetrics?.debtToEquity || 'N/A'}
`.trim();

    const langInstruction =
      locale === 'ar'
        ? 'Respond in Arabic.'
        : locale === 'fr'
          ? 'Répondez en français.'
          : 'Respond in English.';

    const prompt = `You are a financial analyst. Based on the following stock data, generate a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for this stock. Each section should have 3-5 bullet points.

${context}

${langInstruction}

Format your response EXACTLY as JSON:
{
  "strengths": ["point1", "point2", "point3"],
  "weaknesses": ["point1", "point2", "point3"],
  "opportunities": ["point1", "point2", "point3"],
  "threats": ["point1", "point2", "point3"]
}

Only output the JSON, no other text.`;

    // Call AI
    const result = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 1200, locale: 'en' }  // V387: English pipeline — OpenRouter (Haiku) first
    );

    // Parse AI response
    let swotData: any;
    try {
      const content = result.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        swotData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback: generate basic SWOT from available data
      swotData = {
        strengths: [
          company?.eps && company.eps > 0
            ? `Positive EPS of $${company.eps.toFixed(2)}`
            : 'Listed on major exchange',
          company?.dividendYield && company.dividendYield > 0
            ? `Dividend yield of ${company.dividendYield.toFixed(2)}%`
            : 'Established market presence',
          company?.sector
            ? `Leading position in ${company.sector} sector`
            : 'Diversified operations',
        ],
        weaknesses: [
          company?.peRatio && company.peRatio > 30
            ? `High P/E ratio of ${company.peRatio.toFixed(1)}`
            : 'Market competition',
          keyMetrics?.debtToEquity && keyMetrics.debtToEquity > 2
            ? `High debt-to-equity ratio of ${keyMetrics.debtToEquity.toFixed(2)}`
            : 'Margin pressure',
          'Economic sensitivity',
        ],
        opportunities: [
          rating?.ratingRecommendation?.toLowerCase().includes('buy')
            ? 'Analyst buy recommendation'
            : 'Market expansion potential',
          'Growth in sector demand',
          'Technological innovation',
        ],
        threats: [
          'Market volatility and economic downturns',
          'Regulatory changes',
          'Competitive pressure',
        ],
      };
    }

    const response = { symbol, locale, swot: swotData, generatedAt: new Date().toISOString() };

    // Cache result for 24h
    swotCache.set(cacheKey, { data: response, expires: Date.now() + CACHE_TTL });

    return NextResponse.json({ status: 'ok', source: 'generated', ...response });
  } catch (err: any) {
    console.error('[SWOT API POST] Error:', err.message);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
}
