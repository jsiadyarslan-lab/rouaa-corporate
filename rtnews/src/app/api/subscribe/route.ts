// ─── Report Subscription API V62 ─────────────────────────────
// Subscribe, confirm, and unsubscribe for report newsletters
// POST /api/subscribe — Subscribe
// GET /api/subscribe/confirm?token=xxx — Confirm subscription
// DELETE /api/subscribe — Unsubscribe

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/subscribe — Subscribe to reports newsletter
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, frequency, categories, regions } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 });
    }

    const validFrequencies = ['daily', 'weekly', 'monthly', 'breaking'];
    const freq = validFrequencies.includes(frequency) ? frequency : 'daily';

    // Check if already subscribed
    const existing = await db.reportSubscription.findFirst({
      where: { email, isActive: true },
    });

    if (existing) {
      // Update preferences if already subscribed
      await db.reportSubscription.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          frequency: freq,
          categories: JSON.stringify(categories || JSON.parse(existing.categories)),
          regions: JSON.stringify(regions || JSON.parse(existing.regions)),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تحديث تفضيلات اشتراكك',
      });
    }

    // Create new subscription
    const confirmToken = crypto.randomBytes(32).toString('hex');

    const subscription = await db.reportSubscription.create({
      data: {
        email,
        name: name || null,
        frequency: freq,
        categories: JSON.stringify(categories || []),
        regions: JSON.stringify(regions || []),
        isActive: true,
        confirmToken,
        isConfirmed: false,
      },
    });

    console.log(`[Subscribe] New subscription: ${email} (${freq})`);

    // In production, send confirmation email here
    // For now, just log it
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/subscribe/confirm?token=${confirmToken}`;
    console.log(`[Subscribe] Confirmation URL: ${confirmUrl}`);

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل اشتراكك بنجاح. يرجى تأكيد بريدك الإلكتروني.',
    }, { status: 201 });
  } catch (error) {
    return apiError(error, 'اشتراك النشرة');
  }
}

// GET /api/subscribe/confirm?token=xxx — Confirm subscription
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'رمز التأكيد مطلوب' }, { status: 400 });
    }

    const subscription = await db.reportSubscription.findFirst({
      where: { confirmToken: token, isActive: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'رمز التأكيد غير صالح أو منتهي الصلاحية' }, { status: 404 });
    }

    if (subscription.isConfirmed) {
      return NextResponse.json({
        success: true,
        message: 'تم تأكيد اشتراكك بالفعل',
      });
    }

    await db.reportSubscription.update({
      where: { id: subscription.id },
      data: { isConfirmed: true },
    });

    console.log(`[Subscribe] Confirmed: ${subscription.email}`);

    // Return a nice confirmation page
    return new NextResponse(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم تأكيد الاشتراك — رؤى</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #0a0a1a, #1a1a3e); color: #fff; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(0,229,255,0.2); border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; }
    .card h1 { font-size: 28px; margin-bottom: 16px; color: #00E5FF; }
    .card p { font-size: 16px; color: #ccc; line-height: 1.8; }
    .card a { display: inline-block; margin-top: 24px; padding: 12px 32px; background: linear-gradient(135deg, #00E5FF, #8B5CF6); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✓ تم تأكيد الاشتراك</h1>
    <p>شكراً لك! تم تأكيد اشتراكك في نشرة رؤى البريدية. ستتلقى التحديثات وفقاً للتفضيلات التي اخترتها.</p>
    <a href="/">العودة للرئيسية</a>
  </div>
</body>
</html>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return apiError(error, 'تأكيد الاشتراك');
  }
}

// DELETE /api/subscribe — Unsubscribe
export async function DELETE(request: Request) {
  try {
    let email: string | undefined;

    // Try body first
    try {
      const body = await request.json();
      email = body.email;
    } catch {
      // Check query params
      const { searchParams } = new URL(request.url);
      email = searchParams.get('email') || undefined;
    }

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const subscription = await db.reportSubscription.findFirst({
      where: { email, isActive: true },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        message: 'لا يوجد اشتراك نشط لهذا البريد',
      });
    }

    await db.reportSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false },
    });

    console.log(`[Subscribe] Unsubscribed: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء اشتراكك في النشرة البريدية',
    });
  } catch (error) {
    return apiError(error, 'إلغاء الاشتراك');
  }
}
