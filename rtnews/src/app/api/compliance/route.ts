// ─── Compliance API ──────────────────────────────────────────
// Content compliance, disclaimer management, audit trail

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const COMPLIANCE_CONFIG = {
  disclaimers: {
    financial: 'المعلومات المنشورة على رؤى هي لأغراض إعلامية وتعليمية فقط ولا تشكل نصيحة استثمارية أو توصية بالتداول. الأداء السابق لا يضمن النتائج المستقبلية. يرجى استشارة مستشار مالي مرخص قبل اتخاذ أي قرارات استثمارية.',
    aiGenerated: 'هذا المحتوى تم إنشاؤه أو تحليله بواسطة الذكاء الاصطناعي وقد يحتوي على أخطاء. يرجى التحقق من المعلومات من مصادر موثوقة.',
    dataDelay: 'بيانات السوق قد تتأخر. الأسعار المعروضة ليست بالضرورة أسعار الوقت الحقيقي.',
  },
  contentRules: {
    maxDailyAI: 50,          // Max AI-generated articles per day
    requireHumanReview: true, // AI articles need human review before publishing
    prohibitedContent: ['investment advice', 'guaranteed returns', 'pump and dump'],
    minConfidenceScore: 0.7,  // Minimum AI confidence for publishing
  },
};

// GET: Compliance status and rules
export async function GET() {
  try {
    // Check today's AI articles count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aiArticlesToday = await db.newsItem.count({
      where: {
        newsType: 'article',
        createdAt: { gte: today },
      },
    });

    // Articles pending review
    const pendingReview = await db.newsItem.count({
      where: {
        newsType: 'article',
        isPublished: false,
      },
    });

    // Total articles with disclaimers
    const totalArticles = await db.newsItem.count({
      where: { newsType: 'article', isReady: true },  // V38: Only complete articles
    });

    return NextResponse.json({
      compliance: {
        status: aiArticlesToday <= COMPLIANCE_CONFIG.contentRules.maxDailyAI ? 'compliant' : 'warning',
        disclaimers: COMPLIANCE_CONFIG.disclaimers,
        contentRules: COMPLIANCE_CONFIG.contentRules,
        metrics: {
          aiArticlesToday,
          maxDailyAI: COMPLIANCE_CONFIG.contentRules.maxDailyAI,
          pendingReview,
          totalPublished: totalArticles,
        },
        checks: {
          dailyLimitOk: aiArticlesToday <= COMPLIANCE_CONFIG.contentRules.maxDailyAI,
          humanReviewEnabled: COMPLIANCE_CONFIG.contentRules.requireHumanReview,
          confidenceThreshold: COMPLIANCE_CONFIG.contentRules.minConfidenceScore,
        },
      },
    });
  } catch (error: any) {
    console.error('[Compliance] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
