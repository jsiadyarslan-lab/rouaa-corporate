// ─── Telegram Channel Publishing API ─────────────────────────
// POST: Publish a message to the @rouatradingnews channel
// GET:  Check channel publishing status

import { NextRequest, NextResponse } from 'next/server';
import { publishToChannel, publishAlertToChannel, publishDailySummaryToChannel, formatChannelMessage } from '@/lib/telegram-channel-publisher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/telegram/channel
 *
 * أنواع النشر:
 * - default: نشر خبر (title, summary, sentiment, impactLevel, affectedAssets, slug)
 * - action: "alert" — تنبيه سعري (symbol, name, price, changePercent, level, direction)
 * - action: "daily_summary" — ملخص يومي (marketOverview, items, topHeadlines, outlook)
 * - action: "preview" — معاينة بدون إرسال
 * - action: "test" — رسالة اختبار
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ─── رسالة اختبار ───
    if (action === 'test') {
      const result = await publishToChannel({
        title: 'رسالة اختبار',
        titleAr: 'رسالة اختبار من نظام النشر',
        summary: 'هذه رسالة اختبار للتأكد من عمل نظام النشر للقناة',
        summaryAr: 'هذه رسالة اختبار للتأكد من عمل نظام النشر للقناة',
        newsType: 'breaking',
        sentiment: 'neutral',
        impactLevel: 'medium',
        affectedAssets: '[]',
        category: 'general',
      });

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'تم إرسال رسالة الاختبار للقناة بنجاح ✅'
          : `فشل الإرسال: ${result.error}`,
      });
    }

    // ─── معاينة بدون إرسال ───
    if (action === 'preview') {
      const text = formatChannelMessage({
        title: body.title || 'عنوان الخبر',
        titleAr: body.titleAr || body.title || 'عنوان الخبر',
        summary: body.summary || '',
        summaryAr: body.summaryAr || body.summary || '',
        newsType: body.newsType || 'market_update',
        sentiment: body.sentiment || 'neutral',
        impactLevel: body.impactLevel || 'medium',
        affectedAssets: body.affectedAssets || '[]',
        category: body.category || 'general',
        slug: body.slug,
        source: body.source,
        aiAnalysis: body.aiAnalysis,
        generatedImage: body.generatedImage,
        imageUrl: body.imageUrl,
      });

      return NextResponse.json({
        preview: text,
        note: 'هذه معاينة فقط. استخدم POST بدون action=preview للإرسال الفعلي.',
      });
    }

    // ─── تنبيه سعري ───
    if (action === 'alert') {
      if (!body.symbol || !body.name || body.price === undefined) {
        return NextResponse.json(
          { error: 'symbol و name و price مطلوبون' },
          { status: 400 }
        );
      }

      const result = await publishAlertToChannel({
        symbol: body.symbol,
        name: body.name,
        price: body.price,
        changePercent: body.changePercent || 0,
        level: body.level || 'breakout',
        direction: body.direction || 'above',
        note: body.note,
        slug: body.slug,
      });

      return NextResponse.json({ success: result.success, error: result.error });
    }

    // ─── ملخص يومي ───
    if (action === 'daily_summary') {
      const result = await publishDailySummaryToChannel({
        marketOverview: body.marketOverview || 'أداء مختلط للأسواق',
        items: body.items || [],
        topHeadlines: body.topHeadlines || [],
        outlook: body.outlook,
      });

      return NextResponse.json({ success: result.success, error: result.error });
    }

    // ─── نشر خبر (افتراضي) ───
    if (!body.title) {
      return NextResponse.json(
        { error: 'title مطلوب' },
        { status: 400 }
      );
    }

    const result = await publishToChannel({
      title: body.title,
      titleAr: body.titleAr,
      summary: body.summary || '',
      summaryAr: body.summaryAr,
      contentAr: body.contentAr,
      newsType: body.newsType || 'market_update',
      sentiment: body.sentiment || 'neutral',
      impactLevel: body.impactLevel || 'medium',
      affectedAssets: body.affectedAssets || '[]',
      category: body.category || 'general',
      slug: body.slug,
      source: body.source,
      aiAnalysis: body.aiAnalysis,
      generatedImage: body.generatedImage,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({ success: result.success, error: result.error });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Channel API] Error:', msg);
    return NextResponse.json({ error: 'فشل النشر للقناة' }, { status: 500 });
  }
}

/**
 * GET /api/telegram/channel — حالة نظام نشر القناة
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    channel_configured: !!process.env.TELEGRAM_CHAT_ID,
    channel_id: process.env.TELEGRAM_CHAT_ID ? 'configured' : 'not set',
    actions: {
      publish: 'POST { title, summary, sentiment, impactLevel, ... }',
      alert: 'POST { action: "alert", symbol, name, price, changePercent, level, direction }',
      daily_summary: 'POST { action: "daily_summary", marketOverview, items, topHeadlines }',
      preview: 'POST { action: "preview", ... } — معاينة بدون إرسال',
      test: 'POST { action: "test" } — رسالة اختبار',
    },
  });
}
