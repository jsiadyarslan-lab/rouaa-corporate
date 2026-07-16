import { NextResponse } from 'next/server';
import { clearPersistentCache } from '@/lib/persistent-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  await clearPersistentCache('live-news');
  await clearPersistentCache('breaking-news');
  return NextResponse.json({ success: true, message: 'Caches cleared' });
}
