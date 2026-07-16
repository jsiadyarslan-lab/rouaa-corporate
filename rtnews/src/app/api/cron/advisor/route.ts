// ─── مساعد رؤى — Scheduled Advisor Run ───────────────────
// يُستدعى من cron لتوليد التوصيات لجميع المستخدمين

import { NextRequest, NextResponse } from 'next/server';
import { runAdvisorForAllUsers } from '@/lib/advisor/orchestrator';
import { isAdminAuthenticated } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // التحقق من الصلاحيات (internal call أو admin)
    const isAdmin = await isAdminAuthenticated(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runAdvisorForAllUsers();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API:Cron:Advisor] Error:', error.message);
    return NextResponse.json(
      { error: 'Advisor cron failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
