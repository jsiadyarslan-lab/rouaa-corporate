// ─── مساعد رؤى — Profile Analyzer Agent ────────────────────
// يحلل ملف المستخدم ويبني سياقه الاستثماري

import { db } from '@/lib/db';
import type { InvestorProfile, MarketContext } from './types';

export async function analyzeProfile(userId: string): Promise<{
  profile: InvestorProfile;
  context: MarketContext;
} | null> {
  try {
    // جلب ملف المستخدم
    // Use findFirst instead of findUnique — findUnique requires a UNIQUE constraint
    // on userId which may not exist if the table was created by raw SQL.
    const userProfile = await db.userProfile.findFirst({
      where: { userId },
    });

    if (!userProfile) {
      console.log('[Advisor:ProfileAnalyzer] No profile found for user:', userId);
      return null;
    }

    const profile: InvestorProfile = {
      userId: userProfile.userId,
      experienceLevel: userProfile.experienceLevel as InvestorProfile['experienceLevel'],
      riskTolerance: userProfile.riskTolerance as InvestorProfile['riskTolerance'],
      investmentHorizon: userProfile.investmentHorizon as InvestorProfile['investmentHorizon'],
      preferredAssets: JSON.parse(userProfile.preferredAssets || '[]'),
      preferredMarkets: JSON.parse(userProfile.preferredMarkets || '[]'),
      capitalRange: userProfile.capitalRange,
      tradingFrequency: userProfile.tradingFrequency as InvestorProfile['tradingFrequency'],
      interests: JSON.parse(userProfile.interests || '[]'),
      excludedAssets: JSON.parse((userProfile as any).excludedAssets || '[]'),
      minConfidenceScore: (userProfile as any).minConfidenceScore || 40,
      successRate: (userProfile as any).successRate || 0,
      allowGeneralRecommendations: (userProfile as any).allowGeneralRecommendations ?? false,
    };

    // جلب السياق السوقي — آخر 20 خبر من فئات المستخدم المفضلة
    const recentNews = await db.newsItem.findMany({
      where: {
        isReady: true,
        isPublished: true,
        fetchedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      orderBy: { fetchedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        titleAr: true,
        category: true,
        sentiment: true,
        impactLevel: true,
        affectedAssets: true,
        publishedAt: true,
      },
    });

    // جلب الإشارات النشطة — مع أسعار الدخول والهدف ووقف الخسارة (PR#23)
    const activeSignals = await db.tradingSignal.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        pair: true,
        action: true,
        confidence: true,
        category: true,
        status: true,
        entryPrice: true,
        stopLoss: true,
        takeProfit: true,
        riskReward: true,
        timeframe: true,
      },
    });

    // جلب الأحداث الاقتصادية القادمة
    const economicEvents = await db.economicEvent.findMany({
      where: {
        eventDate: { gte: new Date() },
        importance: { in: ['high', 'critical'] },
      },
      orderBy: { eventDate: 'asc' },
      take: 10,
      select: {
        id: true,
        eventName: true,
        importance: true,
        eventDate: true,
        country: true,
      },
    });

    // تحليل المشاعر العامة
    const recentNewsForSentiment = recentNews.slice(0, 10);
    const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
    for (const news of recentNewsForSentiment) {
      if (news.sentiment === 'bullish' || news.sentiment === 'positive') sentimentCounts.bullish++;
      else if (news.sentiment === 'bearish' || news.sentiment === 'negative') sentimentCounts.bearish++;
      else sentimentCounts.neutral++;
    }

    const overallSentiment = sentimentCounts.bullish > sentimentCounts.bearish ? 'bullish'
      : sentimentCounts.bearish > sentimentCounts.bullish ? 'bearish'
      : 'neutral';

    // بناء سياق المشاعر حسب القطاع
    const sectors: Record<string, string> = {};
    const categoryGroups: Record<string, { bullish: number; bearish: number }> = {};
    for (const news of recentNews) {
      const cat = news.category || 'أخرى';
      if (!categoryGroups[cat]) categoryGroups[cat] = { bullish: 0, bearish: 0 };
      if (news.sentiment === 'bullish' || news.sentiment === 'positive') categoryGroups[cat].bullish++;
      else if (news.sentiment === 'bearish' || news.sentiment === 'negative') categoryGroups[cat].bearish++;
    }
    for (const [cat, counts] of Object.entries(categoryGroups)) {
      sectors[cat] = counts.bullish > counts.bearish ? 'bullish'
        : counts.bearish > counts.bullish ? 'bearish'
        : 'neutral';
    }

    const context: MarketContext = {
      recentNews: recentNews.map(n => ({
        id: n.id,
        title: n.titleAr || '',
        category: n.category,
        sentiment: n.sentiment,
        impactLevel: n.impactLevel,
        affectedAssets: JSON.parse(n.affectedAssets || '[]'),
        publishedAt: n.publishedAt?.toISOString() || '',
      })),
      activeSignals: activeSignals.map(s => ({
        id: s.id,
        pair: s.pair,
        action: s.action,
        confidence: s.confidence,
        category: s.category,
        status: s.status,
        entryPrice: s.entryPrice,
        stopLoss: s.stopLoss,
        takeProfit: s.takeProfit,
        riskReward: s.riskReward,
        timeframe: s.timeframe,
      })),
      marketSentiment: {
        overall: overallSentiment,
        sectors,
      },
      economicEvents: economicEvents.map(e => ({
        id: e.id,
        eventName: e.eventName,
        importance: e.importance,
        eventDate: e.eventDate.toISOString(),
        country: e.country,
      })),
    };

    console.log(`[Advisor:ProfileAnalyzer] Profile analyzed: ${profile.experienceLevel}/${profile.riskTolerance}/${profile.investmentHorizon}, context: ${context.recentNews.length} news, ${context.activeSignals.length} signals`);
    return { profile, context };
  } catch (error: any) {
    console.error('[Advisor:ProfileAnalyzer] Error:', error.message);
    return null;
  }
}
