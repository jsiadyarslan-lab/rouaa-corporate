// ─── Passkey Authentication Options ──────────────────────────
import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const rpID = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).hostname
  : 'localhost';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { passkeys: true },
    });

    if (!user || user.passkeys.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد باسكي مسجل لهذا الحساب' },
        { status: 404 }
      );
    }

    // Allow all existing passkeys
    const allowCredentials = user.passkeys.map((pk) => ({
      id: pk.credentialId,
      type: 'public-key' as const,
      transports: JSON.parse(pk.transports) as AuthenticatorTransport[],
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge
    await db.verificationToken.create({
      data: {
        identifier: `passkey-auth:${user.id}`,
        token: options.challenge,
        expires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({
      ...options,
      userId: user.id,
    });
  } catch (error: any) {
    console.error('[Passkey Auth Options] Error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ في تجهيز خيارات الباسكي' },
      { status: 500 }
    );
  }
}
