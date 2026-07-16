// Update sourceName for all Rouaa articles - locale specific
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SOURCE_NAMES: Record<string, string> = {
  ar: 'محرر رؤى الذكي',
  en: 'Rouaa AI Editor',
  fr: 'Rédacteur IA Rouaa',
  tr: 'Rouaa AI Editör',
  es: 'Editor IA Rouaa',
};

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let totalUpdated = 0;
    
    for (const [locale, name] of Object.entries(SOURCE_NAMES)) {
      const result = await db.newsItem.updateMany({
        where: {
          OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
          locale,
        },
        data: { sourceName: name },
      });
      totalUpdated += result.count;
    }

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      names: SOURCE_NAMES,
    });
  } catch (err: any) {
    console.error('[update-source-name] Error:', err);
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  }
}
