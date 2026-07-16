// ─── Integration: Push Notifications V1 ─────────────────────
// Receives push notifications from the trading platform and
// stores them for SSE broadcast to connected clients.
//
// Usage: POST /api/integration/notify
// Auth: X-Integration-Key header (required)
// Body: { type: 'signal' | 'alert' | 'breaking', title: string, message: string, data?: any }

import { NextRequest, NextResponse } from 'next/server';
import { verifyIntegrationKey, createIntegrationError, createIntegrationResponse } from '@/lib/integration-auth';
import { getSyncCache } from '@/lib/integration-cache';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['signal', 'alert', 'breaking', 'market', 'info'];

export async function POST(request: NextRequest) {
  // Requires integration key
  if (!verifyIntegrationKey(request)) {
    return createIntegrationError('مفتاح التكامل غير صالح', 401);
  }

  try {
    const body = await request.json();
    const { type, title, message, data } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return createIntegrationError(
        `نوع الإشعار غير صالح. الأنواع المسموحة: ${VALID_TYPES.join(', ')}`,
        400
      );
    }

    if (!title || typeof title !== 'string') {
      return createIntegrationError('عنوان الإشعار مطلوب', 400);
    }

    // Create notification object
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      title: title.slice(0, 200),
      message: (message || '').slice(0, 1000),
      data: data || null,
      timestamp: new Date().toISOString(),
    };

    // Store in cache for SSE pickup
    const cache = getSyncCache();
    await cache.set('notifications:latest', notification, 5 * 60 * 1000); // 5 min TTL

    // Also store in recent list (keep last 20)
    const recentKey = 'notifications:recent';
    const recent = await cache.get(recentKey) || [];
    const updated = [notification, ...recent].slice(0, 20);
    await cache.set(recentKey, updated, 30 * 60 * 1000); // 30 min TTL

    return createIntegrationResponse({
      success: true,
      id: notification.id,
      timestamp: notification.timestamp,
    });
  } catch (error: any) {
    console.error('[Integration Notify] Failed:', error?.message);
    return createIntegrationError('فشل في معالجة الإشعار', 500);
  }
}

// GET: Retrieve recent notifications
export async function GET(request: NextRequest) {
  const isAuth = verifyIntegrationKey(request);

  const cache = getSyncCache();
  const recent = await cache.get('notifications:recent') || [];

  return NextResponse.json(
    {
      notifications: recent,
      count: recent.length,
      source: isAuth ? 'authenticated' : 'public',
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=5',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const partnerUrl = process.env.INTEGRATION_PARTNER_URL || '';

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': partnerUrl || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Integration-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
