// ─── مساعد رؤى — Recommendation Action API (PR#23) ──────────
// PATCH: تحديث حالة توصية (قراءة، رفض، تنفيذ، ملاحظات)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, action, feedback, executionPrice } = body;

    if (!recommendationId || !action) {
      return NextResponse.json(
        { error: 'recommendationId and action are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (action) {
      case 'read':
        updateData.isRead = true;
        break;
      case 'dismiss':
        updateData.isDismissed = true;
        updateData.feedbackType = 'dismissed';
        break;
      case 'action':
        updateData.isActioned = true;
        updateData.isRead = true;
        updateData.feedbackType = 'executed';
        updateData.executedAt = new Date();
        if (executionPrice) {
          updateData.executionPrice = String(executionPrice);
        }
        break;
      case 'ignore':
        updateData.isDismissed = true;
        updateData.feedbackType = 'ignored';
        break;
      case 'useful':
        updateData.feedbackType = 'useful';
        break;
      case 'not_useful':
        updateData.feedbackType = 'not_useful';
        break;
      case 'feedback':
        if (!feedback || !['positive', 'negative', 'neutral', 'executed', 'ignored', 'dismissed', 'useful', 'not_useful'].includes(feedback)) {
          return NextResponse.json(
            { error: 'Invalid feedback value' },
            { status: 400 }
          );
        }
        updateData.userFeedback = feedback;
        if (['executed', 'ignored', 'dismissed', 'useful', 'not_useful'].includes(feedback)) {
          updateData.feedbackType = feedback;
        }
        if (feedback === 'executed') {
          updateData.isActioned = true;
          updateData.executedAt = new Date();
          if (executionPrice) {
            updateData.executionPrice = String(executionPrice);
          }
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: read, dismiss, action, ignore, useful, not_useful, feedback' },
          { status: 400 }
        );
    }

    const updated = await db.personalizedRecommendation.update({
      where: { id: recommendationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      recommendation: {
        id: updated.id,
        isRead: updated.isRead,
        isDismissed: updated.isDismissed,
        isActioned: updated.isActioned,
        userFeedback: updated.userFeedback,
        feedbackType: (updated as any).feedbackType || null,
        executedAt: (updated as any).executedAt || null,
        executionPrice: (updated as any).executionPrice || null,
      },
    });
  } catch (error: any) {
    console.error('[API:Advisor:Recommendation] PATCH error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}
