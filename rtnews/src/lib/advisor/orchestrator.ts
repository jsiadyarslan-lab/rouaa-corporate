// ─── مساعد رؤى — Advisor Orchestrator (PR#23) ───────────────
// المنسق الرئيسي — يجمع كل وكلاء القرار
// محدّث: حفظ الحقول الجديدة + تصفية الثقة والأصول المستبعدة

import { db } from '@/lib/db';
import { analyzeProfile } from './profile-analyzer';
import { scoreReportsForProfile } from './report-scorer';
import { generateRecommendations, type Locale } from './recommendation-engine';
import { monitorPortfolio, reviewExecutedRecommendations } from './portfolio-monitor';
import type { AdvisorResult, Recommendation } from './types';

/**
 * تشغيل مساعد رؤى لمستخدم معين
 * يمر عبر 4 مراحل: تحليل الملف → تقييم التقارير → توليد التوصيات → مراقبة المحفظة
 */
export async function runAdvisorForUser(userId: string, locale: Locale = 'ar'): Promise<AdvisorResult | null> {
  const startTime = Date.now();
  console.log(`[Advisor:Orchestrator] Starting advisor run for user: ${userId}`);

  try {
    // V123: Ensure user profile exists before running advisor
    // Use findFirst instead of findUnique — findUnique requires a UNIQUE constraint
    // on userId which may not exist if the table was created by raw SQL.
    let profileRecord = await db.userProfile.findFirst({ where: { userId } });
    if (!profileRecord) {
      try {
        // V123: Ensure user exists in users table first (required by FK constraint)
        const existingUser = await db.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
          // Create a placeholder user if not exists (e.g., for temp IDs)
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
            // User might exist already (race condition) — that's OK
            console.warn(`[Advisor:Orchestrator] User creation note: ${userCreateErr.message?.slice(0, 80)}`);
          }
        }

        profileRecord = await db.userProfile.create({
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
        console.log(`[Advisor:Orchestrator] Auto-created profile for user ${userId}`);
      } catch (createErr: any) {
        console.warn(`[Advisor:Orchestrator] Could not auto-create profile: ${createErr.message}`);
        return null;
      }
    }

    // المرحلة 1: تحليل الملف الشخصي والسياق السوقي
    const analysisResult = await analyzeProfile(userId);
    if (!analysisResult) {
      console.log(`[Advisor:Orchestrator] Profile analysis failed for user ${userId}, skipping`);
      return null;
    }

    const { profile, context } = analysisResult;

    // المرحلة 2: تقييم التقارير والأخبار
    const scoredReports = await scoreReportsForProfile(profile);

    // المرحلة 3: توليد التوصيات بالذكاء الاصطناعي
    const advisorResult = await generateRecommendations(profile, context, scoredReports, locale);

    // المرحلة 4: مراقبة المحفظة
    const monitorResult = await monitorPortfolio(userId);

    // دمج التنبيهات الجديدة من المراقبة
    const allRecommendations = [...advisorResult.recommendations, ...monitorResult.newAlerts];

    // حفظ التوصيات في قاعدة البيانات
    // V123: Reuse profileRecord from above (already fetched/created)
    const savedProfileRecord = profileRecord || await db.userProfile.findFirst({
      where: { userId },
      select: { id: true, excludedAssets: true, minConfidenceScore: true },
    });

    if (savedProfileRecord) {
      // تصفية بناءً على الحد الأدنى للثقة والأصول المستبعدة
      const excludedAssets: string[] = JSON.parse(savedProfileRecord.excludedAssets || '[]');
      const minConfidence = savedProfileRecord.minConfidenceScore || 40;

      const filteredRecommendations = allRecommendations.filter(rec => {
        // تصفية حسب الحد الأدنى للثقة
        if (rec.confidenceScore < minConfidence) return false;
        // تصفية الأصول المستبعدة
        if (rec.asset && excludedAssets.length > 0) {
          const assetLower = rec.asset.toLowerCase();
          if (excludedAssets.some(ex => assetLower.includes(ex.toLowerCase()))) return false;
        }
        return true;
      });

      for (const rec of filteredRecommendations) {
        try {
          await db.personalizedRecommendation.create({
            data: {
              userId,
              profileId: savedProfileRecord.id,
              recommendationType: rec.recommendationType,
              title: rec.title,
              titleEn: rec.titleEn,
              summary: rec.summary,
              reasoning: rec.reasoning,
              actionItems: JSON.stringify(rec.actionItems),
              relatedAssetClasses: JSON.stringify(rec.relatedAssetClasses),
              relatedSymbols: JSON.stringify(rec.relatedSymbols),
              relatedReportIds: JSON.stringify(rec.relatedReportIds),
              relatedNewsIds: JSON.stringify(rec.relatedNewsIds),
              confidenceScore: rec.confidenceScore,
              urgencyLevel: rec.urgencyLevel,
              validFrom: new Date(),
              validUntil: new Date(Date.now() + (rec.validUntilHours || 24) * 60 * 60 * 1000),
              sourceData: JSON.stringify(rec.sourceData),
              generatedBy: 'advisor',
              // حقول PR#23
              reportId: rec.reportId || null,
              reportSlug: rec.reportSlug || null,
              reportTitle: rec.reportTitle || null,
              asset: rec.asset || null,
              action: rec.action || null,
              entryPrice: rec.entryPrice || null,
              targetPrice: rec.targetPrice || null,
              stopLoss: rec.stopLoss || null,
              timeHorizon: rec.timeHorizon || null,
              allocationPercent: rec.allocationPercent || null,
            },
          });
        } catch (dbError: any) {
          console.error(`[Advisor:Orchestrator] Failed to save recommendation:`, dbError.message);
        }
      }

      // تحديث توقيت آخر تشغيل
      await db.userProfile.update({
        where: { userId },
        data: { lastAdvisorRun: new Date() },
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Advisor:Orchestrator] Completed for user ${userId}: ${allRecommendations.length} recommendations in ${duration}ms`);

    return {
      success: true,
      recommendations: allRecommendations,
      profileSnapshot: profile,
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error(`[Advisor:Orchestrator] Error for user ${userId}:`, error.message);
    return {
      success: false,
      recommendations: [],
      profileSnapshot: {
        userId,
        experienceLevel: 'beginner',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        preferredAssets: [],
        preferredMarkets: [],
        capitalRange: 'unknown',
        tradingFrequency: 'weekly',
        interests: [],
        excludedAssets: [],
        minConfidenceScore: 40,
        successRate: 0,
        allowGeneralRecommendations: false,
      },
      generatedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * تشغيل المساعد لجميع المستخدمين النشطين
 * يُستدعى من cron job
 */
export async function runAdvisorForAllUsers(): Promise<{
  totalUsers: number;
  successCount: number;
  failCount: number;
  totalRecommendations: number;
}> {
  console.log('[Advisor:Orchestrator] Starting bulk advisor run...');

  try {
    // جلب المستخدمين الذين أكملوا onboarding ومفعّل لديهم المساعد
    const activeProfiles = await db.userProfile.findMany({
      where: {
        onboardingComplete: true,
        advisorEnabled: true,
      },
      select: { userId: true, lastAdvisorRun: true },
    });

    let successCount = 0;
    let failCount = 0;
    let totalRecommendations = 0;

    for (const profile of activeProfiles) {
      // لا تشغ المساعد أكثر من مرة كل 6 ساعات
      if (profile.lastAdvisorRun) {
        const hoursSinceLastRun = (Date.now() - new Date(profile.lastAdvisorRun).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 6) {
          console.log(`[Advisor:Orchestrator] Skipping user ${profile.userId} — last run was ${hoursSinceLastRun.toFixed(1)}h ago`);
          continue;
        }
      }

      try {
        const result = await runAdvisorForUser(profile.userId);
        if (result && result.success) {
          successCount++;
          totalRecommendations += result.recommendations.length;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
        console.error(`[Advisor:Orchestrator] Failed for user ${profile.userId}:`, err);
      }

      // تأخير بين المستخدمين لتجنب ضغط قاعدة البيانات
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[Advisor:Orchestrator] Bulk run complete: ${successCount}/${activeProfiles.length} users, ${totalRecommendations} recommendations`);
    return {
      totalUsers: activeProfiles.length,
      successCount,
      failCount,
      totalRecommendations,
    };
  } catch (error: any) {
    console.error('[Advisor:Orchestrator] Bulk run error:', error.message);
    return {
      totalUsers: 0,
      successCount: 0,
      failCount: 0,
      totalRecommendations: 0,
    };
  }
}

/**
 * تشغيل مراجعة التوصيات المنفذة لجميع المستخدمين
 * يُشغّل أسبوعياً أو يدوياً
 */
export async function runPortfolioReviewForAllUsers(): Promise<{
  totalUsers: number;
  totalReviewed: number;
  totalPnlUpdated: number;
}> {
  console.log('[Advisor:Orchestrator] Starting portfolio review for all users...');

  try {
    const activeProfiles = await db.userProfile.findMany({
      where: { onboardingComplete: true },
      select: { userId: true },
    });

    let totalReviewed = 0;
    let totalPnlUpdated = 0;

    for (const profile of activeProfiles) {
      try {
        const result = await reviewExecutedRecommendations(profile.userId);
        totalReviewed += result.reviewedCount;
        totalPnlUpdated += result.updatedPnlCount;
      } catch (err) {
        console.error(`[Advisor:Orchestrator] Review failed for user ${profile.userId}:`, err);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`[Advisor:Orchestrator] Portfolio review complete: ${activeProfiles.length} users, ${totalReviewed} reviewed, ${totalPnlUpdated} PnL updated`);
    return {
      totalUsers: activeProfiles.length,
      totalReviewed,
      totalPnlUpdated,
    };
  } catch (error: any) {
    console.error('[Advisor:Orchestrator] Portfolio review error:', error.message);
    return {
      totalUsers: 0,
      totalReviewed: 0,
      totalPnlUpdated: 0,
    };
  }
}
