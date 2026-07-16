import { NextRequest, NextResponse } from 'next/server';

// V164: Report recommendation feedback endpoint
// Records user feedback on report recommendations (helpful / not_helpful / executed)
// This data will be used for future personalization features

const VALID_ACTIONS = ['helpful', 'not_helpful', 'executed'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: helpful, not_helpful, executed' },
        { status: 400 }
      );
    }

    // For now, log the feedback. In future phases, this will:
    // 1. Store in a PersonalizedRecommendation table
    // 2. Track which recommendations the user found useful
    // 3. Personalize future recommendations based on feedback history
    console.log(`[V164 Feedback] Report ${id}: ${action} at ${new Date().toISOString()}`);

    // TODO: Phase 4 - Store in database
    // await prisma.recommendationFeedback.create({
    //   data: {
    //     reportId: id,
    //     action,
    //     userId: session?.user?.id || 'anonymous',
    //     createdAt: new Date(),
    //   }
    // });

    return NextResponse.json({ success: true, action, reportId: id });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
