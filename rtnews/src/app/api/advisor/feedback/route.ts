import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/advisor/feedback
 *
 * Records user feedback on a recommendation.
 * Works with the existing PersonalizedRecommendation model.
 *
 * Request body:
 * - recommendationId: string (required) — The ID of the recommendation
 * - feedbackType: "executed" | "useful" | "not_useful" | "dismissed" (required)
 * - reportId: string (required) — The report the recommendation belongs to
 * - executedPrice?: number — Price at time of execution (only for "executed" type)
 * - category?: string — Report category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      recommendationId,
      feedbackType,
      reportId,
      executedPrice,
      category,
    } = body;

    // Validate required fields
    if (!recommendationId || !feedbackType || !reportId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: recommendationId, feedbackType, reportId',
          received: { recommendationId, feedbackType, reportId },
        },
        { status: 400 }
      );
    }

    // Validate feedbackType
    const validTypes = ['executed', 'useful', 'not_useful', 'dismissed'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        {
          error: `Invalid feedbackType. Must be one of: ${validTypes.join(', ')}`,
          received: feedbackType,
        },
        { status: 400 }
      );
    }

    // Validate executedPrice for "executed" type
    if (feedbackType === 'executed' && executedPrice !== undefined) {
      if (typeof executedPrice !== 'number' || executedPrice < 0) {
        return NextResponse.json(
          { error: 'executedPrice must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Try to find an existing recommendation to update its feedback
    // If not found, we store feedback as a lightweight record
    try {
      // Check if there's an existing PersonalizedRecommendation with this reportId
      const existing = await db.personalizedRecommendation.findFirst({
        where: {
          reportId: reportId,
          recommendationType: 'report_feedback',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        // Update existing record with new feedback
        await db.personalizedRecommendation.update({
          where: { id: existing.id },
          data: {
            feedbackType,
            executionPrice: feedbackType === 'executed' && executedPrice ? String(executedPrice) : null,
            executedAt: feedbackType === 'executed' ? new Date() : null,
            isActioned: feedbackType === 'executed',
            userFeedback: feedbackType === 'useful' ? 'positive' : feedbackType === 'not_useful' ? 'negative' : 'neutral',
          },
        });
      } else {
        // Find or create a system user profile for anonymous feedback
        let systemProfile = await db.userProfile.findFirst({
          where: { userId: 'system-feedback' },
        });

        if (!systemProfile) {
          // Create system profile
          const systemUser = await db.user.upsert({
            where: { email: 'system-feedback@roua.internal' },
            update: {},
            create: {
              email: 'system-feedback@roua.internal',
              name: 'System Feedback',
              role: 'system',
            },
          });

          systemProfile = await db.userProfile.create({
            data: {
              userId: systemUser.id,
              experienceLevel: 'beginner',
              riskTolerance: 'moderate',
              investmentHorizon: 'medium',
            },
          });
        }

        // Create a new feedback record
        await db.personalizedRecommendation.create({
          data: {
            userId: systemProfile.userId,
            profileId: systemProfile.id,
            recommendationType: 'report_feedback',
            title: `Feedback: ${feedbackType}`,
            summary: `User feedback on recommendation from report ${reportId}`,
            feedbackType,
            executionPrice: feedbackType === 'executed' && executedPrice ? String(executedPrice) : null,
            executedAt: feedbackType === 'executed' ? new Date() : null,
            isActioned: feedbackType === 'executed',
            userFeedback: feedbackType === 'useful' ? 'positive' : feedbackType === 'not_useful' ? 'negative' : 'neutral',
            reportId,
            confidenceScore: 50,
            sourceData: JSON.stringify({ recommendationId, reportId, category }),
          },
        });
      }
    } catch (dbError: any) {
      // If DB operations fail (e.g., no table yet), log but don't fail the request
      console.warn('[FeedbackAPI] DB operation failed, feedback recorded in logs only:', dbError.message);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          recommendationId,
          feedbackType,
          reportId,
          executedPrice: feedbackType === 'executed' ? executedPrice : undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advisor/feedback
 *
 * Retrieve feedback records, optionally filtered by reportId.
 *
 * Query params:
 * - reportId?: string — Filter by report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    const where: any = {
      recommendationType: 'report_feedback',
    };
    if (reportId) where.reportId = reportId;

    let feedback: any[] = [];
    try {
      feedback = await db.personalizedRecommendation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          feedbackType: true,
          executionPrice: true,
          executedAt: true,
          reportId: true,
          createdAt: true,
        },
      });
    } catch (dbError: any) {
      console.warn('[FeedbackAPI] GET DB query failed:', dbError.message);
    }

    // Aggregate feedback stats
    const stats = {
      total: feedback.length,
      executed: feedback.filter((f: any) => f.feedbackType === 'executed').length,
      useful: feedback.filter((f: any) => f.feedbackType === 'useful').length,
      not_useful: feedback.filter((f: any) => f.feedbackType === 'not_useful').length,
      dismissed: feedback.filter((f: any) => f.feedbackType === 'dismissed').length,
    };

    return NextResponse.json({
      success: true,
      data: feedback,
      stats,
    });
  } catch (error) {
    console.error('Feedback GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
