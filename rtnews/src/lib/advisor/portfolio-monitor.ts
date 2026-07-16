// ─── مساعد رؤى — Portfolio Monitor Agent (PR#23) ────────────
// يراقب المحفظة ويتحقق من حالة التوصيات السابقة
// محدّث: مراجعة التوصيات المنفذة + حساب الأرباح/الخسائر + تحديث معدل النجاح

import { db } from '@/lib/db';
import type { InvestorProfile, Recommendation, PortfolioMonitorResult } from './types';

export async function monitorPortfolio(userId: string): Promise<PortfolioMonitorResult> {
  try {
    const now = new Date();

    // 1. تحديث التوصيات المنتهية الصلاحية
    const expired = await db.personalizedRecommendation.updateMany({
      where: {
        userId,
        isDismissed: false,
        validUntil: { lt: now },
        isActioned: false,
      },
      data: {
        isDismissed: true,
      },
    });

    // 2. عدّ التوصيات غير المقروءة
    const unreadCount = await db.personalizedRecommendation.count({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
      },
    });

    // 3. عدّ التوصيات المنفّذة
    const actionedCount = await db.personalizedRecommendation.count({
      where: {
        userId,
        isActioned: true,
      },
    });

    // 4. فحص إذا كان هناك تنبيهات جديدة يجب توليدها
    const newAlerts: Recommendation[] = [];

    // فحص الأحداث الاقتصادية الحرجة
    const criticalEvents = await db.economicEvent.findMany({
      where: {
        eventDate: {
          gte: now,
          lte: new Date(now.getTime() + 6 * 60 * 60 * 1000), // خلال 6 ساعات
        },
        importance: 'critical',
      },
      take: 5,
    });

    for (const event of criticalEvents) {
      // تحقق من عدم وجود تنبيه سابق لنفس الحدث
      const existingAlert = await db.personalizedRecommendation.findFirst({
        where: {
          userId,
          recommendationType: 'risk_alert',
          sourceData: { contains: event.id },
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingAlert) {
        newAlerts.push({
          recommendationType: 'risk_alert',
          title: `تنبيه حرج: ${event.eventName} خلال ساعات`,
          titleEn: `Critical Alert: ${event.eventName} within hours`,
          summary: `الحدث الاقتصادي "${event.eventName}" من ${event.country} سيحدث قريباً. قد يتسبب في تقلبات حادة.`,
          reasoning: `الأحداث ذات الأهمية الحرجة تسبب عادة تقلبات كبيرة في الأسواق. يُنصح بتقليل المراكز المفتوحة وتفعيل أوامر وقف الخسارة.`,
          actionItems: [
            'تفقد المراكز المفتوحة',
            'تفعيل أوامر وقف الخسارة',
            'تجنب فتح مراكز جديدة قبل الحدث',
          ],
          relatedAssetClasses: ['forex'],
          relatedSymbols: [],
          relatedReportIds: [],
          relatedNewsIds: [],
          confidenceScore: 85,
          urgencyLevel: 'critical',
          validUntilHours: 6,
          sourceData: { eventId: event.id, eventType: 'critical_economic_event' },
          action: 'مراقبة',
        });
      }
    }

    // فحص الإشارات عالية الثقة
    const highConfSignals = await db.tradingSignal.findMany({
      where: {
        status: 'ACTIVE',
        confidence: { gte: 80 },
        createdAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      },
      take: 3,
    });

    for (const signal of highConfSignals) {
      const existingRec = await db.personalizedRecommendation.findFirst({
        where: {
          userId,
          sourceData: { contains: signal.id },
          createdAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
        },
      });

      if (!existingRec) {
        newAlerts.push({
          recommendationType: 'market_opportunity',
          title: `إشارة عالية الثقة: ${signal.pair} — ${signal.action === 'BUY' ? 'شراء' : 'بيع'}`,
          titleEn: `High-Confidence Signal: ${signal.pair} — ${signal.action}`,
          summary: `إشارة ${signal.action === 'BUY' ? 'شراء' : 'بيع'} على ${signal.pair} بثقة ${signal.confidence}%.`,
          reasoning: `الإشارة من فئة ${signal.category} بإطار زمني ${signal.timeframe}. الثقة عالية (${signal.confidence}%).`,
          actionItems: [
            `مراجعة الرسم البياني لـ ${signal.pair}`,
            'مقارنة مع تحليلات أخرى',
            'تحديد نقطة الدخول والخروج',
          ],
          relatedAssetClasses: [signal.category],
          relatedSymbols: [signal.pair],
          relatedReportIds: [],
          relatedNewsIds: [],
          confidenceScore: signal.confidence,
          urgencyLevel: 'high',
          validUntilHours: 8,
          sourceData: { signalId: signal.id, signalType: 'high_confidence_trading_signal' },
          asset: signal.pair,
          action: signal.action === 'BUY' ? 'شراء' : signal.action === 'SELL' ? 'بيع' : 'مراقبة',
          entryPrice: signal.entryPrice?.toString(),
          targetPrice: signal.takeProfit?.toString(),
          stopLoss: signal.stopLoss?.toString(),
        });
      }
    }

    console.log(`[Advisor:PortfolioMonitor] User ${userId}: expired=${expired.count}, unread=${unreadCount}, actioned=${actionedCount}, newAlerts=${newAlerts.length}`);

    return {
      expiredCount: expired.count,
      actionedCount,
      unreadCount,
      newAlerts,
      reviewedCount: 0,
      updatedPnlCount: 0,
      successRateChange: 0,
    };
  } catch (error: any) {
    console.error('[Advisor:PortfolioMonitor] Error:', error.message);
    return {
      expiredCount: 0,
      actionedCount: 0,
      unreadCount: 0,
      newAlerts: [],
      reviewedCount: 0,
      updatedPnlCount: 0,
      successRateChange: 0,
    };
  }
}

/**
 * مراجعة التوصيات المنفذة — يقارن سعر التنفيذ مع السعر الحالي/الهدف
 * يُشغّل أسبوعياً أو يدوياً عبر advisor:monitor
 */
export async function reviewExecutedRecommendations(userId: string): Promise<{
  reviewedCount: number;
  updatedPnlCount: number;
  successRateChange: number;
}> {
  try {
    const now = new Date();

    // جلب التوصيات المنفذة التي لم تُراجع بعد (لا يوجد actualProfitLoss)
    const executedRecs = await db.personalizedRecommendation.findMany({
      where: {
        userId,
        feedbackType: 'executed',
        executedAt: { not: null },
        actualProfitLoss: null,
        entryPrice: { not: null },
        targetPrice: { not: null },
      },
      take: 50,
    });

    let updatedPnlCount = 0;
    let successCount = 0;
    let totalReviewed = 0;

    for (const rec of executedRecs) {
      try {
        const entryPrice = parseFloat(rec.entryPrice!.replace(/,/g, ''));
        const targetPrice = parseFloat(rec.targetPrice!.replace(/,/g, ''));
        const executionPrice = rec.executionPrice
          ? parseFloat(rec.executionPrice.replace(/,/g, ''))
          : entryPrice;

        if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(executionPrice)) continue;

        totalReviewed++;

        // محاولة جلب السعر الحالي من MarketIndicator
        let currentPrice: number | null = null;
        if (rec.asset) {
          const symbol = rec.asset.replace('/', '').toLowerCase();
          const indicator = await db.marketIndicator.findFirst({
            where: {
              symbol: { contains: symbol, mode: 'insensitive' },
            },
            select: { value: true },
          });
          if (indicator) currentPrice = indicator.value;
        }

        // حساب الربح/الخسارة
        const effectivePrice = currentPrice || targetPrice;
        const isBuyAction = rec.action === 'شراء' || rec.action === 'تجميع';
        const pnlPercent = isBuyAction
          ? ((effectivePrice - executionPrice) / executionPrice) * 100
          : ((executionPrice - effectivePrice) / executionPrice) * 100;

        // تحديد النجاح: هل وصل السعر للهدف؟
        let isSuccessful: boolean | null = null;
        if (currentPrice) {
          if (isBuyAction) {
            isSuccessful = currentPrice >= targetPrice;
          } else {
            isSuccessful = currentPrice <= targetPrice;
          }
        } else {
          // إذا لا يوجد سعر حالي، نستخدم تقدير بناءً على اتجاه السعر
          if (isBuyAction) {
            isSuccessful = pnlPercent > 0;
          } else {
            isSuccessful = pnlPercent > 0;
          }
        }

        if (isSuccessful) successCount++;

        // تحديث التوصية
        await db.personalizedRecommendation.update({
          where: { id: rec.id },
          data: {
            actualProfitLoss: Math.round(pnlPercent * 100) / 100,
            isSuccessful,
          },
        });

        updatedPnlCount++;
      } catch (recError: any) {
        console.error(`[Advisor:PortfolioMonitor] Failed to review rec ${rec.id}:`, recError.message);
      }
    }

    // تحديث معدل النجاح في ملف المستخدم
    let successRateChange = 0;
    if (totalReviewed > 0) {
      const newSuccessRate = (successCount / totalReviewed) * 100;
      // Use findFirst instead of findUnique — findUnique requires a UNIQUE constraint
      // on userId which may not exist if the table was created by raw SQL.
      const profile = await db.userProfile.findFirst({ where: { userId } });
      if (profile) {
        const oldRate = profile.successRate || 0;
        // حساب المعدل التراكمي
        const totalSuccessful = await db.personalizedRecommendation.count({
          where: { userId, isSuccessful: true },
        });
        const totalWithResult = await db.personalizedRecommendation.count({
          where: { userId, isSuccessful: { not: null } },
        });
        const cumulativeRate = totalWithResult > 0 ? (totalSuccessful / totalWithResult) * 100 : 0;

        await db.userProfile.update({
          where: { userId },
          data: { successRate: Math.round(cumulativeRate * 100) / 100 },
        });

        successRateChange = cumulativeRate - oldRate;
      }
    }

    console.log(`[Advisor:PortfolioMonitor:Review] User ${userId}: reviewed=${totalReviewed}, pnlUpdated=${updatedPnlCount}, successRateChange=${successRateChange.toFixed(1)}`);

    return {
      reviewedCount: totalReviewed,
      updatedPnlCount,
      successRateChange: Math.round(successRateChange * 100) / 100,
    };
  } catch (error: any) {
    console.error('[Advisor:PortfolioMonitor:Review] Error:', error.message);
    return {
      reviewedCount: 0,
      updatedPnlCount: 0,
      successRateChange: 0,
    };
  }
}
