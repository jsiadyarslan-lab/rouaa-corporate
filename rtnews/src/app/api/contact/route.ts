import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST: Submit contact form
export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'الرسالة قصيرة جداً (10 أحرف على الأقل)' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'الرسالة طويلة جداً (5000 حرف كحد أقصى)' }, { status: 400 });
    }

    // Save to database
    const contactMessage = await db.contactMessage.create({
      data: {
        name: name.slice(0, 200),
        email: email.slice(0, 200),
        subject: (subject || '').slice(0, 500),
        message: message.slice(0, 5000),
      },
    });

    console.log(`[Contact] New message from: ${name} <${email}>, Subject: ${subject || 'بدون موضوع'}`);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً',
      id: contactMessage.id,
    });
  } catch (error: any) {
    console.error('[Contact] Error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى لاحقاً' }, { status: 500 });
  }
}

// GET: List contact messages (admin only)
export async function GET(request: Request) {
  // Admin-only endpoint
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'new';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const where = status !== 'all' ? { status } : {};

    const [messages, total] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contactMessage.count({ where }),
    ]);

    return NextResponse.json({ messages, total, page, limit });
  } catch (error: any) {
    console.error('[Contact GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
