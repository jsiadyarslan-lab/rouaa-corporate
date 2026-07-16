// @ts-nocheck
// ─── Passkey Registration Verification ───────────────────────
import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';

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
        identifier: `passkey-register:${userId}`,
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

    // Verify registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: verificationToken.token,
      expectedOrigin,
      expectedRPID: rpID,
    });

    // V156: Clean up the challenge — log error instead of swallowing
    await db.verificationToken.delete({
      where: { token: verificationToken.token },
    }).catch(err => console.error('[Passkey V156] Failed to delete verification token after registration:', err instanceof Error ? err.message : err));

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'فشل التحقق من الباسكي' },
        { status: 400 }
      );
    }

    const { registrationInfo } = verification;

    // Save the passkey
    await db.passkey.create({
      data: {
        userId,
        credentialId: registrationInfo.credentialID,
        publicKey: registrationInfo.credentialPublicKey,
        counter: registrationInfo.credentialDeviceType === 'singleDevice' ? 0 : 0,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: JSON.stringify(registrationInfo.credentialTransport || []),
        name: credential.name || null,
      },
    });

    // V156: Update user provider — log error instead of swallowing
    await db.user.update({
      where: { id: userId },
      data: { provider: 'passkey' },
    }).catch(err => console.error('[Passkey V156] Failed to update user provider to passkey:', err instanceof Error ? err.message : err));

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الباسكي بنجاح',
    });
  } catch (error: any) {
    console.error('[Passkey Register Verify] Error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ في التحقق من الباسكي' },
      { status: 500 }
    );
  }
}
