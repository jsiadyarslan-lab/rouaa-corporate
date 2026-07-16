// ─── Agent API Key Setup ──────────────────────────────────
// Creates or retrieves the system API key for ROUA agents
// Requires CRON_SECRET or ADMIN_SECRET for authorization

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const AGENT_KEY_NAME = 'ROUA Agents Bridge Key';

export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const adminSecret = process.env.ADMIN_SECRET;
    const bearerToken = authHeader?.replace('Bearer ', '');

    const isAuthorized =
      (cronSecret && bearerToken === cronSecret) ||
      (adminSecret && bearerToken === adminSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'غير مصرح — يتطلب CRON_SECRET أو ADMIN_SECRET' }, { status: 401 });
    }

    // Check if agent key already exists
    const existing = await db.apiKey.findFirst({
      where: { name: AGENT_KEY_NAME, isActive: true },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'مفتاح الوكلاء موجود مسبقاً',
        apiKey: {
          id: existing.id,
          key: existing.key,
          name: existing.name,
          plan: existing.plan,
          rateLimit: existing.rateLimit,
        },
      });
    }

    // Create new agent API key
    const key = `rva_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await db.apiKey.create({
      data: {
        key,
        name: AGENT_KEY_NAME,
        plan: 'enterprise',
        rateLimit: 10000,
        userId: null,
      },
    });

    console.log('[Agent Key Setup] Created system API key for agents');

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء مفتاح الوكلاء بنجاح',
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
    console.error('[Agent Key Setup] Error:', error.message);
    return NextResponse.json({ error: 'Failed to setup agent key' }, { status: 500 });
  }
}

// GET: Retrieve the agent API key (for setup verification)
export async function GET(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const adminSecret = process.env.ADMIN_SECRET;
    const bearerToken = authHeader?.replace('Bearer ', '');

    const isAuthorized =
      (cronSecret && bearerToken === cronSecret) ||
      (adminSecret && bearerToken === adminSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const existing = await db.apiKey.findFirst({
      where: { name: AGENT_KEY_NAME, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ exists: false, message: 'لا يوجد مفتاح وكلاء بعد' });
    }

    return NextResponse.json({
      exists: true,
      apiKey: {
        id: existing.id,
        key: existing.key,
        name: existing.name,
        plan: existing.plan,
        rateLimit: existing.rateLimit,
        createdAt: existing.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve agent key' }, { status: 500 });
  }
}
