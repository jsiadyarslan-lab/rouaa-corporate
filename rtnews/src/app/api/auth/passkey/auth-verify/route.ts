// @ts-nocheck
// ─── Passkey Authentication Verification ─────────────────────
import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { getAdminSecret } from '@/lib/auth-utils';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const rpID = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).hostname
  : 'localhost';

const expectedOrigin = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, credential } = body;

    if (!userId || !credential) {
      return NextResponse.json(
        { error: 'بيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // Find the stored challenge
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: `passkey-auth:${userId}`,
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'انتهت صلاحية الطلب. حاول مرة أخرى.' },
        { status: 400 }
      );
    }

    // Find the passkey
    const passkey = await db.passkey.findFirst({
      where: { userId, credentialId: credential.id },
    });

    if (!passkey) {
      return NextResponse.json(
        { error: 'الباسكي غير مسجل' },
        { status: 404 }
      );
    }

    // Verify authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: verificationToken.token,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: JSON.parse(passkey.transports) as AuthenticatorTransport[],
      },
    });

    // V156: Clean up challenge — log error instead of swallowing
    await db.verificationToken.delete({
      where: { token: verificationToken.token },
    }).catch(err => console.error('[Passkey V156] Failed to delete verification token after auth:', err instanceof Error ? err.message : err));

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'فشل التحقق من الباسكي' },
        { status: 401 }
      );
    }

    // Update passkey counter and lastUsedAt
    await db.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Create a user session token (compatible with NextAuth JWT strategy)
    const secret = getAdminSecret();
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: 'passkey',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Passkey Auth Verify] Error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ في التحقق من الباسكي' },
      { status: 500 }
    );
  }
}
