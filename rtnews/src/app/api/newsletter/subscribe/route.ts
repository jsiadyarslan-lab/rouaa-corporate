import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST: Subscribe to newsletter
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Re-subscribe
        await db.newsletterSubscriber.update({
          where: { email },
          data: { status: 'active', name: name || existing.name },
        });
        return NextResponse.json({
          success: true,
          message: 'تم إعادة تفعيل اشتراكك في النشرة البريدية',
        });
      }
      return NextResponse.json({
        success: true,
        message: 'أنت مشترك بالفعل في النشرة البريدية',
      });
    }

    // New subscription
    await db.newsletterSubscriber.create({
      data: { email, name: name || null, source: 'website' },
    });

    console.log(`[Newsletter] New subscription: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'تم تسجيلك في النشرة البريدية بنجاح',
    });
  } catch (error: any) {
    console.error('[Newsletter] Subscribe error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}

// DELETE: Unsubscribe
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    await db.newsletterSubscriber.update({
      where: { email },
      data: { status: 'unsubscribed' },
    }).catch(() => {
      // Subscriber might not exist
    });

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء اشتراكك في النشرة البريدية',
    });
  } catch (error: any) {
    console.error('[Newsletter DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
