// ─── Token Verification V47 ────────────────────────────────────
// V47: Now includes session expiry time for client-side session management
// V44: Uses shared auth-utils for JWT verification (single source of truth)
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, getAdminSecret } from '@/lib/auth-utils';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const isValid = await verifyAdminToken(token);
    if (!isValid) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Decode token to get payload (already verified above)
    const SECRET = getAdminSecret();
    const { payload } = await jwtVerify(token, SECRET);

    // V47: Include expiry time so client can warn before session expires
    const expiresAt = payload.exp ? (payload.exp as number) * 1000 : null;
    const now = Date.now();
    const remainingMs = expiresAt ? expiresAt - now : null;

    return NextResponse.json({
      authenticated: true,
      role: payload.role,
      loginAt: payload.loginAt,
      expiresAt,
      remainingMs,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
