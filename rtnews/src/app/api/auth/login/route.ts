// ─── Admin Authentication V47 ─────────────────────────────────
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';
import { authRateLimit } from '@/lib/rate-limit';
import { getAdminSecret } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// V47: Improved timing-safe string comparison
// FIX: Previous version returned false immediately when lengths differed,
// creating a timing leak that reveals password length. Now we pad both
// strings to the same length before comparing, so timing is always constant.
function safeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length, 64);
  const bufA = Buffer.alloc(maxLen);
  const bufB = Buffer.alloc(maxLen);
  bufA.write(a, 0, 'utf8');
  bufB.write(b, 0, 'utf8');
  // Always compare the full buffer length to maintain constant time
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    // Rate limiting — prevent brute force attacks
    const rateCheck = authRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'كلمة السر مطلوبة' },
        { status: 400 }
      );
    }

    const adminSecret = process.env.ADMIN_SECRET;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const devAdminPassword = process.env.DEV_ADMIN_PASSWORD;

    let isAuthorized = false;

    // V46: Use timing-safe comparison to prevent timing attacks
    // Check 1: Primary ADMIN_PASSWORD
    if (adminPassword && safeEqual(password, adminPassword)) {
      isAuthorized = true;
    } 
    // Check 2: Emergency fallback using ADMIN_SECRET
    else if (adminSecret && safeEqual(password, adminSecret)) {
      console.log('[Auth] Emergency login using ADMIN_SECRET detected.');
      isAuthorized = true;
    }
    // Check 3: Development fallback (not timing-safe — dev only)
    else if (process.env.NODE_ENV !== 'production' && devAdminPassword && password === devAdminPassword) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      console.warn(`[Auth] Failed login attempt from IP: ${ip} at ${new Date().toISOString()}`);
      
      // Check if variables are even set to help diagnose 500 vs 401
      if (!adminPassword && !adminSecret && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'إعدادات الأمان غير مكتملة على السيرفر (Missing Env Vars)' }, { status: 500 });
      }

      return NextResponse.json({ error: 'كلمة السر غير صحيحة' }, { status: 401 });
    }

    // Create JWT token using shared secret
    const SECRET = getAdminSecret();
    const token = await new SignJWT({
      role: 'admin',
      loginAt: new Date().toISOString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(SECRET);

    // Log successful login
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`[Auth] Successful admin login from IP: ${ip} at ${new Date().toISOString()}`);

    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
    });

    // Set HTTP-only cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'تم تسجيل الخروج' });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
