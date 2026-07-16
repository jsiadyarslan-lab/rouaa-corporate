// ─── User Session Check ──────────────────────────────────────
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: (session.user as any).role || 'user',
      },
    });
  } catch (error: any) {
    console.error('[Auth Session] Error:', error.message);
    return NextResponse.json({ authenticated: false });
  }
}
