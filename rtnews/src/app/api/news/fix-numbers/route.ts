// Fix broken numbers in existing Rouaa articles
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function fixNumbers(text: string): string {
  if (!text) return text;
  let r = text;
  r = r.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');
  r = r.replace(/(\d)\s+%/g, '$1%');
  r = r.replace(/\$\s+(\d)/g, '$$$1');
  r = r.replace(/([A-Z])\.\s+([A-Z])/g, '$1.$2');
  return r;
}

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await db.newsItem.findMany({
      where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }] },
      select: { id: true, title: true, summary: true, content: true, contentAr: true, titleAr: true, summaryAr: true, aiAnalysis: true },
      take: 200,
    });

    let fixed = 0;
    for (const a of articles) {
      const updates: any = {};
      
      if (a.title && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.title)) {
        updates.title = fixNumbers(a.title);
      }
      if (a.titleAr && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.titleAr)) {
        updates.titleAr = fixNumbers(a.titleAr);
      }
      if (a.summary && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.summary)) {
        updates.summary = fixNumbers(a.summary);
      }
      if (a.summaryAr && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.summaryAr)) {
        updates.summaryAr = fixNumbers(a.summaryAr);
      }
      if (a.content && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.content)) {
        updates.content = fixNumbers(a.content);
      }
      if (a.contentAr && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.contentAr)) {
        updates.contentAr = fixNumbers(a.contentAr);
      }
      
      // Fix aiAnalysis too
      if (a.aiAnalysis && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(a.aiAnalysis)) {
        try {
          const parsed = JSON.parse(a.aiAnalysis);
          let changed = false;
          for (const field of ['fullContent', 'editedArticle', 'introduction', 'body', 'conclusion', 'recommendation', 'summary']) {
            if (typeof parsed[field] === 'string' && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(parsed[field])) {
              parsed[field] = fixNumbers(parsed[field]);
              changed = true;
            }
          }
          if (Array.isArray(parsed.keyTakeaways)) {
            parsed.keyTakeaways = parsed.keyTakeaways.map((k: any) => {
              if (typeof k === 'string' && /\d\s*\.\s*\d|[A-Z]\.\s+[A-Z]/.test(k)) {
                changed = true;
                return fixNumbers(k);
              }
              return k;
            });
          }
          if (changed) {
            updates.aiAnalysis = JSON.stringify(parsed);
          }
        } catch {}
      }

      if (Object.keys(updates).length > 0) {
        await db.newsItem.update({ where: { id: a.id }, data: updates });
        fixed++;
      }
    }

    return NextResponse.json({ success: true, fixed, total: articles.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message?.slice(0, 300) }, { status: 500 });
  }
}
