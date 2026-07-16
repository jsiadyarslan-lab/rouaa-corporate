// ─── مساعد رؤى — Refresh Prices API (PR#25) ──────────────────
// POST: تحديث أسعار التوصيات الحية من financial-apis
// يمكن تحديث توصية واحدة أو جميع التوصيات النشطة

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refreshRecommendationPrice } from '@/lib/advisor/recommendation-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, userId } = body;

    // تحديث توصية واحدة
    if (recommendationId) {
      // جلب تحمل المخاطر من الملف الشخصي
      let riskTolerance = 'moderate';
      try {
        const profile = await db.userProfile.findFirst({
          where: { userId: userId || undefined },
          select: { riskTolerance: true },
        });
        if (profile?.riskTolerance) riskTolerance = profile.riskTolerance;
      } catch {}

      const result = await refreshRecommendationPrice(recommendationId, riskTolerance);

      if (!result) {
        return NextResponse.json(
          { error: 'Recommendation not found or no price available' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // تحديث جميع التوصيات النشطة للمستخدم
    if (userId) {
      let riskTolerance = 'moderate';
      try {
        // Use findFirst instead of findUnique — findUnique requires a UNIQUE constraint
        // on userId which may not exist if the table was created by raw SQL.
        const profile = await db.userProfile.findFirst({
          where: { userId },
          select: { riskTolerance: true },
        });
        if (profile?.riskTolerance) riskTolerance = profile.riskTolerance;
      } catch {}

      // جلب التوصيات النشطة ذات الأصول
      const activeRecs = await db.personalizedRecommendation.findMany({
        where: {
          userId,
          isDismissed: false,
          asset: { not: null },
          OR: [
            { validUntil: { gte: new Date() } },
            { validUntil: null },
          ],
        },
        select: { id: true, asset: true },
        take: 10,
      });

      let updatedCount = 0;
      let failedCount = 0;
      const updatedRecs: any[] = [];

      for (const rec of activeRecs) {
        try {
          const result = await refreshRecommendationPrice(rec.id, riskTolerance);
          if (result?.updated) {
            updatedCount++;
            updatedRecs.push({
              id: rec.id,
              asset: rec.asset,
              entryPrice: result.entryPrice,
              targetPrice: result.targetPrice,
              stopLoss: result.stopLoss,
              timeHorizon: result.timeHorizon,
            });
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        updatedCount,
        failedCount,
        total: activeRecs.length,
        updated: updatedRecs,
      });
    }

    return NextResponse.json(
      { error: 'recommendationId or userId is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API:Advisor:RefreshPrices] POST error:', error.message);
    return NextResponse.json(
      { error: 'Failed to refresh prices' },
      { status: 500 }
    );
  }
}
