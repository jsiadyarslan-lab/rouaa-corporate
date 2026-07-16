// ─── مساعد رؤى — Report Scorer Agent (PR#23 محدّث) ──────────
// يقيّم التقارير والأخبار بناءً على ملف المستخدم
// محدّث: جلب محتوى التقارير الكامل + أسعار من priceTarget + إرسالها للـ AI

import { db } from '@/lib/db';
import type { InvestorProfile, ScoredReport } from './types';

interface ScorableItem {
  id: string;
  type: string;
  title: string;
  category?: string;
  assetClass?: string;
  scope?: string;
  sectors?: string;
  countries?: string;
  sentiment?: string;
  marketImpact?: string;
  confidenceScore?: number;
  impactScore?: number;
  affectedAssets?: string;
  publishedAt?: Date | null;
  createdAt: Date;
  // حقول جديدة PR#23: محتوى التقرير وأسعاره
  content?: string;
  priceTarget?: string;
  keyIndicators?: string;
  riskLevel?: string;
  analysisType?: string;
  timeFrame?: string;
}

export async function scoreReportsForProfile(
  profile: InvestorProfile
): Promise<ScoredReport[]> {
  try {
    const scored: ScoredReport[] = [];

    // 1. جلب أحدث التقارير الاقتصادية — مع المحتوى الكامل والمؤشرات
    const economicReports = await db.economicReport.findMany({
      where: {
        isPublished: true,
        locale: 'ar',  // V337: Arabic advisor — Arabic reports only
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { publishedAt: 'desc' },
      take: 15,
      select: {
        id: true,
        title: true,
        reportType: true,
        scope: true,
        sectors: true,
        countries: true,
        marketImpact: true,
        confidenceScore: true,
        publishedAt: true,
        createdAt: true,
        slug: true,
        content: true,
        keyIndicators: true,
        summary: true,
      },
    });

    for (const report of economicReports) {
      const score = calculateRelevanceScore(profile, {
        id: report.id,
        type: 'economic_report',
        title: report.title,
        scope: report.scope,
        sectors: report.sectors,
        countries: report.countries,
        marketImpact: report.marketImpact,
        confidenceScore: report.confidenceScore,
        publishedAt: report.publishedAt,
        createdAt: report.createdAt,
        content: report.content || report.summary || undefined,
        keyIndicators: report.keyIndicators || undefined,
      });
      if (score.relevanceScore > 30) {
        scored.push(score);
      }
    }

    // 2. جلب أحدث التحليلات السوقية — مع المحتوى وأسعار الهدف
    const marketAnalyses = await db.marketAnalysis.findMany({
      where: {
        isPublished: true,
        locale: 'ar',  // V337: Arabic advisor — Arabic analyses only
        publishedAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { publishedAt: 'desc' },
      take: 15,
      select: {
        id: true,
        title: true,
        assetClass: true,
        analysisType: true,
        sentiment: true,
        confidenceScore: true,
        riskLevel: true,
        publishedAt: true,
        createdAt: true,
        slug: true,
        content: true,
        priceTarget: true,
        indicators: true,
        timeFrame: true,
      },
    });

    for (const analysis of marketAnalyses) {
      const score = calculateRelevanceScore(profile, {
        id: analysis.id,
        type: 'market_analysis',
        title: analysis.title,
        assetClass: analysis.assetClass,
        sentiment: analysis.sentiment,
        confidenceScore: analysis.confidenceScore,
        publishedAt: analysis.publishedAt,
        createdAt: analysis.createdAt,
        content: analysis.content || undefined,
        priceTarget: analysis.priceTarget || undefined,
        riskLevel: analysis.riskLevel || undefined,
        analysisType: analysis.analysisType || undefined,
        timeFrame: analysis.timeFrame || undefined,
      });
      if (score.relevanceScore > 30) {
        scored.push(score);
      }
    }

    // 3. جلب أحدث الأخبار عالية التأثير
    const highImpactNews = await db.newsItem.findMany({
      where: {
        isReady: true,
        isPublished: true,
        locale: 'ar',  // V337: Arabic advisor — Arabic news only
        impactScore: { gte: 60 },
        fetchedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { impactScore: 'desc' },
      take: 10,
      select: {
        id: true,
        titleAr: true,
        category: true,
        sentiment: true,
        impactScore: true,
        affectedAssets: true,
        publishedAt: true,
        fetchedAt: true,
        createdAt: true,
      },
    });

    for (const news of highImpactNews) {
      const score = calculateRelevanceScore(profile, {
        id: news.id,
        type: 'news',
        title: news.titleAr || '',
        category: news.category,
        sentiment: news.sentiment,
        impactScore: news.impactScore,
        affectedAssets: news.affectedAssets,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
      });
      if (score.relevanceScore > 30) {
        scored.push(score);
      }
    }

    // ترتيب حسب الأهمية
    scored.sort((a, b) => {
      const scoreA = a.relevanceScore * 0.5 + a.urgencyScore * 0.3 + a.impactScore * 0.2;
      const scoreB = b.relevanceScore * 0.5 + b.urgencyScore * 0.3 + b.impactScore * 0.2;
      return scoreB - scoreA;
    });

    console.log(`[Advisor:ReportScorer] Scored ${scored.length} items for profile ${profile.userId}`);
    return scored.slice(0, 20); // أعلى 20 عنصر
  } catch (error: any) {
    console.error('[Advisor:ReportScorer] Error:', error.message);
    return [];
  }
}

function calculateRelevanceScore(
  profile: InvestorProfile,
  item: ScorableItem
): ScoredReport {
  let relevanceScore = 50; // Base score
  let urgencyScore = 30;
  let impactScore = item.confidenceScore || 50;
  const reasons: string[] = [];

  // 1. مطابقة فئات الأصول المفضلة
  const itemAssets = item.affectedAssets ? JSON.parse(item.affectedAssets || '[]') : [];
  const itemSectors = item.sectors ? JSON.parse(item.sectors || '[]') : [];
  const itemCountries = item.countries ? JSON.parse(item.countries || '[]') : [];

  if (item.assetClass && profile.preferredAssets.includes(item.assetClass)) {
    relevanceScore += 20;
    reasons.push(`يتوافق مع اهتمامك بـ ${item.assetClass}`);
  }

  if (itemAssets.some((a: string) => profile.preferredAssets.includes(a))) {
    relevanceScore += 15;
    reasons.push('يتعلق بأصول تتابعها');
  }

  if (itemSectors.some((s: string) => profile.preferredAssets.includes(s))) {
    relevanceScore += 10;
    reasons.push('يتعلق بقطاعات تهمك');
  }

  // 2. مطابقة الأسواق المفضلة
  if (item.scope === 'arabic' && profile.preferredMarkets.includes('arabic')) {
    relevanceScore += 15;
    reasons.push('يتعلق بالأسواق العربية');
  }
  if (item.scope === 'global' && profile.preferredMarkets.includes('global')) {
    relevanceScore += 10;
    reasons.push('يتعلق بالأسواق العالمية');
  }
  if (itemCountries.some((c: string) => profile.preferredMarkets.includes(c))) {
    relevanceScore += 10;
  }

  // 3. تأثير مستوى الخبرة
  if (profile.experienceLevel === 'beginner') {
    if (item.type === 'educational' || item.type === 'economic_report') {
      relevanceScore += 10;
      reasons.push('مناسب لمستوى خبرتك');
    }
    if (item.type === 'market_analysis' && item.sentiment === 'extreme') {
      relevanceScore -= 10;
    }
  } else if (profile.experienceLevel === 'professional') {
    if (item.type === 'market_analysis') {
      relevanceScore += 10;
    }
  }

  // 4. تأثير تحمل المخاطر
  if (profile.riskTolerance === 'conservative') {
    if (item.marketImpact === 'bearish' || item.sentiment === 'bearish' || item.sentiment === 'negative') {
      urgencyScore += 20;
      impactScore += 15;
      reasons.push('تنبيه مهم لمستوى تحمل المخاطر لديك');
    }
  } else if (profile.riskTolerance === 'aggressive') {
    if (item.marketImpact === 'bullish' || item.sentiment === 'bullish' || item.sentiment === 'positive') {
      relevanceScore += 10;
      reasons.push('فرصة تتناسب مع استراتيجيتك');
    }
  }

  // 5. حداثة المعلومات
  const hoursSincePublish = item.publishedAt
    ? (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60)
    : (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);

  if (hoursSincePublish < 2) {
    urgencyScore += 30;
    reasons.push('خبر طازج — خلال ساعتين');
  } else if (hoursSincePublish < 6) {
    urgencyScore += 20;
    reasons.push('خبر حديث — خلال 6 ساعات');
  } else if (hoursSincePublish < 24) {
    urgencyScore += 10;
  }

  // 6. درجة التأثير
  if (item.impactScore && item.impactScore >= 80) {
    impactScore += 20;
    urgencyScore += 15;
    reasons.push('تأثير عالي جداً');
  } else if (item.impactScore && item.impactScore >= 60) {
    impactScore += 10;
  }

  // Bounds
  relevanceScore = Math.min(100, Math.max(0, relevanceScore));
  urgencyScore = Math.min(100, Math.max(0, urgencyScore));
  impactScore = Math.min(100, Math.max(0, impactScore));

  if (reasons.length === 0) {
    reasons.push('قد يهمك بناءً على اهتماماتك');
  }

  // 7. مكافأة التقارير التي تحتوي على أسعار هدف — PR#23
  if (item.priceTarget) {
    try {
      const pt = JSON.parse(item.priceTarget);
      if (pt.current || pt.target || pt.stopLoss) {
        relevanceScore += 15;
        reasons.push('يحتوي على أسعار هدف محددة');
      }
    } catch {}
  }

  // Bounds
  relevanceScore = Math.min(100, Math.max(0, relevanceScore));
  urgencyScore = Math.min(100, Math.max(0, urgencyScore));
  impactScore = Math.min(100, Math.max(0, impactScore));

  if (reasons.length === 0) {
    reasons.push('قد يهمك بناءً على اهتماماتك');
  }

  return {
    id: item.id,
    type: item.type,
    title: item.title,
    relevanceScore,
    urgencyScore,
    impactScore,
    reasons,
    // حقول جديدة PR#23
    content: item.content,
    priceTarget: item.priceTarget,
    keyIndicators: item.keyIndicators,
    riskLevel: item.riskLevel,
    analysisType: item.analysisType,
    timeFrame: item.timeFrame,
    sentiment: item.sentiment,
    assetClass: item.assetClass,
    marketImpact: item.marketImpact,
    confidenceScore: item.confidenceScore,
  };
}
