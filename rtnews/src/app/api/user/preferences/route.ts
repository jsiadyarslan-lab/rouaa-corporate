// ─── User Preferences API ────────────────────────────────────
// Smart customization: save/load user preferences for personalized experience
// Stores: favorite categories, watchlist, notification preferences, theme

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Retrieve user preferences
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return default preferences for anonymous users
      return NextResponse.json({
        preferences: {
          categories: ['اقتصاد كلي', 'أسهم', 'عملات'],
          watchlist: ['EUR/USD', 'XAU/USD', 'SPX'],
          notifications: { breaking: true, price: true, sentiment: false },
          theme: 'dark',
          language: 'ar',
          layout: 'default',
        },
      });
    }

    // Check if user has stored preferences
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Get preferences from site settings (user-specific key)
    const prefSettings = await db.siteSetting.findMany({
      where: { key: { startsWith: `user_${userId}_` } },
    });

    const preferences: Record<string, any> = {
      categories: ['اقتصاد كلي', 'أسهم', 'عملات'],
      watchlist: ['EUR/USD', 'XAU/USD', 'SPX'],
      notifications: { breaking: true, price: true, sentiment: false },
      theme: 'dark',
      language: 'ar',
      layout: 'default',
    };

    for (const setting of prefSettings) {
      const key = setting.key.replace(`user_${userId}_`, '');
      try {
        preferences[key] = JSON.parse(setting.value);
      } catch {
        preferences[key] = setting.value;
      }
    }

    return NextResponse.json({ preferences, plan: user.plan });
  } catch (error: any) {
    console.error('[Preferences] GET error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في تحميل التفضيلات' }, { status: 500 });
  }
}

// PUT: Save user preferences
export async function PUT(request: Request) {
  try {
    const { userId, preferences } = await request.json() as {
      userId: string;
      preferences: Record<string, any>;
    };

    if (!userId || !preferences) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    // Upsert each preference
    const operations = Object.entries(preferences).map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key: `user_${userId}_${key}` },
        update: { value: JSON.stringify(value), group: 'user' },
        create: { key: `user_${userId}_${key}`, value: JSON.stringify(value), group: 'user', type: 'json' },
      })
    );

    await Promise.all(operations);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ تفضيلاتك بنجاح',
    });
  } catch (error: any) {
    console.error('[Preferences] PUT error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في حفظ التفضيلات' }, { status: 500 });
  }
}
