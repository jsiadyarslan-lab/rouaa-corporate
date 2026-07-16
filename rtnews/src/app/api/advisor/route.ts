// ─── مساعد رؤى — Advisor API (PR#23 → PR#26) ──────────────
// GET: جلب التوصيات الحالية للمستخدم
// POST: تشغيل المساعد لتوليد توصيات جديدة

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAdvisorForUser } from '@/lib/advisor/orchestrator';
import { isAdminAuthenticated } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const locale = searchParams.get('locale') || 'ar';

    if (!userId) {
      // V16: Return empty state instead of 400 — homepage component calls this
      // without userId for anonymous visitors. Returning 400 causes console errors.
      return NextResponse.json({
        success: true,
        profile: null,
        recommendations: [],
        stats: { total: 0, unread: 0, critical: 0, high: 0, totalIncludingFeedback: 0, actioned: 0, estimatedSuccessRate: 0 },
        locale: 'ar',
      });
    }

    // جلب التوصيات النشطة (PR#26: نشطة = غير مرفوضة + غير منتهية + لا تقييم بعد)
    const recommendations = await db.personalizedRecommendation.findMany({
      where: {
        userId,
        isDismissed: false,
        OR: [
          { validUntil: { gte: new Date() } },
          { validUntil: null },
        ],
      },
      orderBy: [
        { urgencyLevel: 'desc' },
        { confidenceScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    // جلب الملف الشخصي أولاً (V121: كان يُستخدم قبل تعريفه — سبب خطأ 500)
    // Use findFirst instead of findUnique — findUnique requires a UNIQUE constraint
    // on userId which may not exist if the table was created by raw SQL.
    let profile = await db.userProfile.findFirst({
      where: { userId },
    });

    // V122: Auto-create profile if missing so advisor can generate recommendations
    if (!profile) {
      try {
        // V123: Ensure user exists in users table first (required by FK constraint)
        const existingUser = await db.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
          try {
            await db.user.create({
              data: {
                id: userId,
                email: `${userId}@rouaa.local`,
                name: 'مستخدم رؤى',
                provider: 'advisor',
              },
            });
          } catch (userCreateErr: any) {
            console.warn(`[API:Advisor] User creation note: ${userCreateErr.message?.slice(0, 80)}`);
          }
        }

        profile = await db.userProfile.create({
          data: {
            userId,
            experienceLevel: 'beginner',
            riskTolerance: 'moderate',
            investmentHorizon: 'medium',
            onboardingComplete: false,
            advisorEnabled: true,
            preferredAssets: '[]',
            preferredMarkets: '[]',
            interests: '[]',
            excludedAssets: '[]',
          },
        });
        console.log(`[API:Advisor] Auto-created profile for user ${userId}`);
      } catch (createErr: any) {
        console.warn(`[API:Advisor] Could not auto-create profile: ${createErr.message}`);
      }
    }

    // ── PR#26: تصفية حسب الأصول المفضلة في عرض GET أيضاً ──
    const preferredAssets = profile ? JSON.parse(profile.preferredAssets || '[]') : [];
    const allowGeneral = profile ? ((profile as any).allowGeneralRecommendations ?? false) : true;

    // الكلمات المفتاحية للأصول (نسخة مبسطة للفلترة)
    const ASSET_KW: Record<string, string[]> = {
      'crypto': ['btc', 'eth', 'crypto', 'كريبتو', 'عملات رقمية', 'بيتكوين'],
      'forex': ['eur', 'gbp', 'jpy', 'usd', 'فوركس', 'عملات'],
      'commodities': ['xau', 'xag', 'wti', 'gold', 'oil', 'ذهب', 'نفط', 'سلع'],
      'realEstate': ['عقار', 'إسكان', 'رهن', 'منازل', 'reit', 'سكن'],
      'stocks': ['أسهم', 'بورصة', 'شركات', 's&p', 'nasdaq'],
      'indices': ['مؤشر', 's&p', 'nasdaq', 'داو'],
    };

    const filteredRecs = preferredAssets.length > 0 && !allowGeneral
      ? recommendations.filter(r => {
          const recAsset = ((r as any).asset || '').toLowerCase();
          const recClasses = JSON.parse(r.relatedAssetClasses || '[]').map((c: string) => c.toLowerCase());
          const recTitle = (r.title || '').toLowerCase();
          const recSymbols = JSON.parse(r.relatedSymbols || '[]').join(' ').toLowerCase();

          for (const pref of preferredAssets) {
            const prefLower = pref.toLowerCase();
            // مطابقة فئة الأصل مباشرة
            if (recClasses.includes(prefLower)) return true;
            // مطابقة عبر الكلمات المفتاحية
            const keywords = ASSET_KW[prefLower] || [];
            const allText = `${recAsset} ${recTitle} ${recSymbols}`;
            for (const kw of keywords) {
              if (allText.includes(kw.toLowerCase())) return true;
            }
          }
          return false; // لا تطابق → تصفية
        })
      : recommendations;

    // PR#26: عدّ الإحصائيات — إعادة تعريف "النشطة"
    const activeRecs = filteredRecs.filter(r => !(r as any).feedbackType);
    const stats = {
      total: activeRecs.length, // النشطة فقط (بدون تقييم)
      unread: filteredRecs.filter(r => !r.isRead).length,
      critical: activeRecs.filter(r => r.urgencyLevel === 'critical').length,
      high: activeRecs.filter(r => r.urgencyLevel === 'high').length,
      totalIncludingFeedback: filteredRecs.length, // الكل بما فيه المقيّم
    };

    // إحصائيات PR#23
    const actionedCount = await db.personalizedRecommendation.count({
      where: { userId, feedbackType: 'executed' },
    });
    const successCount = await db.personalizedRecommendation.count({
      where: { userId, isSuccessful: true },
    });
    const totalWithResult = await db.personalizedRecommendation.count({
      where: { userId, isSuccessful: { not: null } },
    });
    const estimatedSuccessRate = totalWithResult > 0 ? Math.round((successCount / totalWithResult) * 100) : 0;

    return NextResponse.json({
      success: true,
      profile: profile ? {
        experienceLevel: profile.experienceLevel,
        riskTolerance: profile.riskTolerance,
        investmentHorizon: profile.investmentHorizon,
        onboardingComplete: profile.onboardingComplete,
        advisorEnabled: profile.advisorEnabled,
        lastAdvisorRun: profile.lastAdvisorRun,
        preferredAssets: JSON.parse(profile.preferredAssets || '[]'),
        excludedAssets: JSON.parse((profile as any).excludedAssets || '[]'),
        minConfidenceScore: (profile as any).minConfidenceScore || 40,
        successRate: (profile as any).successRate || 0,
        allowGeneralRecommendations: (profile as any).allowGeneralRecommendations ?? false,
      } : null,
      recommendations: filteredRecs.map(r => ({
        id: r.id,
        type: r.recommendationType,
        title: r.title,
        titleEn: r.titleEn,
        summary: r.summary,
        reasoning: r.reasoning,
        actionItems: JSON.parse(r.actionItems || '[]'),
        relatedAssetClasses: JSON.parse(r.relatedAssetClasses || '[]'),
        relatedSymbols: JSON.parse(r.relatedSymbols || '[]'),
        relatedReportIds: JSON.parse(r.relatedReportIds || '[]'),
        relatedNewsIds: JSON.parse(r.relatedNewsIds || '[]'),
        confidenceScore: r.confidenceScore,
        urgencyLevel: r.urgencyLevel,
        validFrom: r.validFrom,
        validUntil: r.validUntil,
        isRead: r.isRead,
        isActioned: r.isActioned,
        createdAt: r.createdAt,
        // حقول PR#23
        reportId: (r as any).reportId || null,
        reportSlug: (r as any).reportSlug || null,
        reportTitle: (r as any).reportTitle || null,
        asset: (r as any).asset || null,
        action: (r as any).action || null,
        entryPrice: (r as any).entryPrice || null,
        targetPrice: (r as any).targetPrice || null,
        stopLoss: (r as any).stopLoss || null,
        timeHorizon: (r as any).timeHorizon || null,
        allocationPercent: (r as any).allocationPercent || null,
        feedbackType: (r as any).feedbackType || null,
        executedAt: (r as any).executedAt || null,
        executionPrice: (r as any).executionPrice || null,
        actualProfitLoss: (r as any).actualProfitLoss || null,
        isSuccessful: (r as any).isSuccessful || null,
        sourceData: (() => { try { return JSON.parse(r.sourceData || '{}'); } catch { return {}; } })(),
      })),
      stats: {
        ...stats,
        actioned: actionedCount,
        estimatedSuccessRate,
      },
      locale,
    });
  } catch (error: any) {
    console.error('[API:Advisor] GET error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, locale } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (action === 'generate') {
      // تشغيل المساعد لتوليد توصيات جديدة
      const result = await runAdvisorForUser(userId, locale);
      return NextResponse.json({
        success: result?.success || false,
        count: result?.recommendations.length || 0,
        generatedAt: result?.generatedAt,
        error: result?.error,
      });
    }

    if (action === 'run-all') {
      // تشغيل المساعد لجميع المستخدمين (admin only)
      const isAdmin = await isAdminAuthenticated(request);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { runAdvisorForAllUsers } = await import('@/lib/advisor/orchestrator');
      const result = await runAdvisorForAllUsers();
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === 'review-portfolio') {
      // مراجعة التوصيات المنفذة وحساب الأرباح/الخسائر
      const { reviewExecutedRecommendations } = await import('@/lib/advisor/portfolio-monitor');
      const result = await reviewExecutedRecommendations(userId);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "generate", "run-all", or "review-portfolio"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API:Advisor] POST error:', error.message);
    return NextResponse.json(
      { error: 'Failed to process advisor action' },
      { status: 500 }
    );
  }
}
