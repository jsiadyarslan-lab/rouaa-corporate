import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Check subscription status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ plan: 'free', status: 'active' });
    }

    const subscription = await db.subscription.findFirst({
      where: { userId, status: 'active', endDate: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      plan: subscription?.plan || 'free',
      status: subscription?.status || 'active',
      endDate: subscription?.endDate?.toISOString() || null,
    });
  } catch (error: any) {
    return NextResponse.json({ plan: 'free', status: 'active' });
  }
}

// POST: Create/Upgrade subscription
export async function POST(request: Request) {
  try {
    const { userId, plan, paymentMethod } = await request.json();
    if (!userId || !plan) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    const validPlans = ['pro', 'elite'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'خطة غير صالحة' }, { status: 400 });
    }

    const prices: Record<string, number> = { pro: 29, elite: 79 };
    const durations: Record<string, number> = { pro: 30, elite: 30 };

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (durations[plan] || 30));

    // Deactivate existing subscriptions
    await db.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    const subscription = await db.subscription.create({
      data: {
        userId,
        plan,
        status: 'active',
        startDate: new Date(),
        endDate,
        paymentMethod: paymentMethod || 'demo',
        amount: prices[plan] || 0,
      },
    });

    // Update user plan
    await db.user.update({
      where: { id: userId },
      data: { plan, planExpiresAt: endDate },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}
