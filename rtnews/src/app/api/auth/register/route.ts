// ─── User Registration API ──────────────────────────────────
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, rawClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

// V5 FIX: Use shared db instance instead of new PrismaClient().
// Duplicate PrismaClient creates its own connection pool (3-7 connections),
// exhausting the Supabase free tier limit and causing "too many clients" errors.
// The publishGuard extension is safe for registration — it only guards newsItem updates.
// Use rawClient (unextended) for user/account creation to avoid any extension overhead.
const prisma = rawClient;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة السر مطلوبان' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صحيحة' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مسجل مسبقاً. سجّل دخولك بدلاً من ذلك.' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        provider: 'email',
        role: 'user',
        plan: 'free',
      },
    });

    // Create account record (non-critical)
    try {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'email',
          providerAccountId: email,
        },
      });
    } catch (accErr: any) {
      console.warn('[Auth Register] Account record creation skipped:', accErr.message?.slice(0, 100));
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('[Auth Register] Error:', error.message, error.code, error.meta);
    
    // Provide specific error messages based on Prisma error codes
    if (error.code === 'P2021') {
      return NextResponse.json(
        { error: 'جداول قاعدة البيانات غير مكتملة — يتم تحديثها تلقائياً. حاول بعد دقيقة.' },
        { status: 503 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مسجل مسبقاً' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب', debug: error.code || 'unknown' },
      { status: 500 }
    );
  }
}
