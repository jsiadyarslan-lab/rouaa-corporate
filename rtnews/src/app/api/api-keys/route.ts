// ─── API Keys Management ──────────────────────────────────────
// Generate and manage API keys for the public API

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST: Generate a new API key
// Supports two modes:
//   1. User key: requires userId (existing user in DB)
//   2. System key: requires CRON_SECRET in Authorization header, userId is optional
export async function POST(request: Request) {
  try {
    const { userId, name, plan } = await request.json();

    // Check if this is a system key request (authenticated via CRON_SECRET or ADMIN_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const adminSecret = process.env.ADMIN_SECRET;
    const isSystemRequest =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (adminSecret && authHeader === `Bearer ${adminSecret}`);

    if (!userId && !isSystemRequest) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // For user keys: limit per user
    if (userId) {
      const existingCount = await db.apiKey.count({
        where: { userId, isActive: true },
      });
      if (existingCount >= 5) {
        return NextResponse.json({ error: 'وصلت للحد الأقصى من مفاتيح API (5)' }, { status: 400 });
      }
    }

    const key = `rva_${crypto.randomBytes(24).toString('hex')}`;
    const rateLimits: Record<string, number> = { free: 100, pro: 1000, enterprise: 10000 };

    const apiKey = await db.apiKey.create({
      data: {
        userId: userId || null,
        key,
        name: name || (isSystemRequest ? 'مفتاح نظام' : 'مفتاح API'),
        plan: plan || (isSystemRequest ? 'enterprise' : 'free'),
        rateLimit: rateLimits[plan || (isSystemRequest ? 'enterprise' : 'free')] || 100,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        plan: apiKey.plan,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[ApiKeys] POST error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: List user's API keys
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const keys = await db.apiKey.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        key: true,
        name: true,
        plan: true,
        rateLimit: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Mask keys for security
    const masked = keys.map(k => ({
      ...k,
      key: k.key.slice(0, 8) + '...' + k.key.slice(-4),
    }));

    return NextResponse.json({ keys: masked });
  } catch (error: any) {
    console.error('[ApiKeys] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Revoke API key
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'معرف المفتاح مطلوب' }, { status: 400 });
    }

    await db.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ApiKeys] DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
