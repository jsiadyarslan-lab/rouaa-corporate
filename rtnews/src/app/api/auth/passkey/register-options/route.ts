// ─── Passkey Registration Options ────────────────────────────
import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// RP ID — the domain name of the application
const rpID = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).hostname
  : 'localhost';

const rpName = 'رؤى — Roua Trading News';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Get existing passkey credential IDs for exclusion
    const excludeCredentials = user.passkeys.map((pk) => ({
      id: pk.credentialId,
      type: 'public-key' as const,
      transports: JSON.parse(pk.transports) as AuthenticatorTransport[],
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name || user.email.split('@')[0],
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge in verification token table
    await db.verificationToken.create({
      data: {
        identifier: `passkey-register:${userId}`,
        token: options.challenge,
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('[Passkey Register Options] Error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ في تجهيز خيارات الباسكي' },
      { status: 500 }
    );
  }
}
