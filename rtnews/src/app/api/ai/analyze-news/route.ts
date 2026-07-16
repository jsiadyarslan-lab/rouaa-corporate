// ─── AI News Engine: Advanced Analysis ───────────────────────
// Deep AI analysis of news items: correlation, impact prediction,
// multi-source verification, and market impact scoring

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { sanitizePromptInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

interface AnalysisRequest {
  newsId: string;
  depth?: 'quick' | 'standard' | 'deep';
}

// POST: Run advanced AI analysis on a news item
export async function POST(request: Request) {
  try {
    const { newsId, depth = 'standard' } = await request.json() as AnalysisRequest;

    if (!newsId) {
      return NextResponse.json({ error: 'معرف الخبر مطلوب' }, { status: 400 });
    }

    const news = await db.newsItem.findUnique({
      where: { id: sanitizePromptInput(newsId) },
    });

    if (!news) {
      return NextResponse.json({ error: 'الخبر غير موجود' }, { status: 404 });
    }

    const title = news.titleAr || news.title;
    const summary = news.summaryAr || news.summary;
    const content = news.contentAr || news.content || '';

    // Quick analysis: sentiment + impact only
    if (depth === 'quick') {
      const result = await chatCompletion([
        {
          role: 'system',
          content: 'أنت محلل مالي سريع. حلل الخبر وأعطِ: 1) المشاعر (إيجابي/سلبي/محايد) 2) مستوى التأثير (1-5) 3) الأصول المتأثرة (قائمة). أجب بصيغة JSON فقط.',
        },
        { role: 'user', content: `${title}\n${summary}` },
      ], { temperature: 0.2, maxTokens: 200 });

      return NextResponse.json({
        analysis: { type: 'quick', raw: result.content },
      });
    }

    // Standard analysis: full analysis with market impact
    const analysisPrompt = depth === 'deep'
      ? `أنت محلل مالي خبير. قم بتحليل شامل ومعمق لهذا الخبر. أجب بصيغة JSON بالحقول التالية:
- sentiment: المشاعر العامة (bullish/bearish/neutral)
- sentimentScore: درجة المشاعر (0-100)
- impactLevel: مستوى التأثير (1-5)
- impactReasoning: سبب مستوى التأثير (3 جمل على الأقل)
- affectedAssets: الأصول المتأثرة مع اتجاه التأثير [{symbol, direction, reason}]
- correlatedEvents: أحداث مرتبطة محتملة
- timeframe: الإطار الزمني المتوقع للتأثير (immediate/short-term/medium-term/long-term)
- keyTakeaways: أهم 3-5 نقاط
- riskFactors: عوامل المخاطر
- historicalContext: سياق تاريخي مشابه
- confidence: مستوى الثقة (0-1)`
      : `أنت محلل مالي. قم بتحليل هذا الخبر. أجب بصيغة JSON بالحقول التالية:
- sentiment: المشاعر (bullish/bearish/neutral)
- sentimentScore: درجة المشاعر (0-100)
- impactLevel: مستوى التأثير (1-5)
- affectedAssets: الأصول المتأثرة [{symbol, direction}]
- keyTakeaways: أهم 3 نقاط
- timeframe: الإطار الزمني
- confidence: مستوى الثقة (0-1)`;

    const analysisResult = await chatCompletion([
      { role: 'system', content: analysisPrompt },
      { role: 'user', content: `العنوان: ${title}\n\nالملخص: ${summary}\n\nالمحتوى: ${content.slice(0, 2000)}` },
    ], { temperature: 0.3, maxTokens: depth === 'deep' ? 800 : 400 });

    // Parse the AI analysis
    let parsedAnalysis: any = { raw: analysisResult.content };
    try {
      const jsonMatch = analysisResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Keep raw analysis
    }

    // Multi-source verification (find related articles)
    const relatedArticles = await db.newsItem.findMany({
      where: {
        id: { not: news.id },
        category: news.category,
        fetchedAt: { gte: new Date(Date.now() - 7 * 86400000) },
        isReady: true,  // V38: Only complete articles
      },
      take: 5,
      orderBy: { fetchedAt: 'desc' },
      select: { id: true, titleAr: true, title: true, sentiment: true, sourceName: true },
    });

    // Update the news item with advanced analysis
    const existingAiAnalysis = news.aiAnalysis ? JSON.parse(news.aiAnalysis) : {};
    existingAiAnalysis.advancedAnalysis = parsedAnalysis;
    existingAiAnalysis.analysisDepth = depth;
    existingAiAnalysis.analyzedAt = new Date().toISOString();

    await db.newsItem.update({
      where: { id: news.id },
      data: { aiAnalysis: JSON.stringify(existingAiAnalysis) },
    });

    return NextResponse.json({
      analysis: parsedAnalysis,
      relatedArticles,
      newsId: news.id,
    });
  } catch (error: any) {
    console.error('[AI Analyze] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Get cached analysis for a news item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json({ error: 'معرف الخبر مطلوب' }, { status: 400 });
    }

    const news = await db.newsItem.findUnique({
      where: { id: newsId },
      select: { id: true, aiAnalysis: true },
    });

    if (!news) {
      return NextResponse.json({ error: 'الخبر غير موجود' }, { status: 404 });
    }

    let advancedAnalysis = null;
    if (news.aiAnalysis) {
      try {
        const parsed = JSON.parse(news.aiAnalysis);
        advancedAnalysis = parsed.advancedAnalysis || null;
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      newsId: news.id,
      analysis: advancedAnalysis,
    });
  } catch (error: any) {
    console.error('[AI Analyze GET] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
