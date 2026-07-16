import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDBSchema } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Admin-only endpoint
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('action') === 'reset-stuck') {
      const articles = await db.newsItem.findMany({
        where: {
          isReady: false,
          processingStage: { in: ['fetched', 'translated', 'analyzed', 'imaged'] }
        }
      });

      let resetCount = 0;
      for (const article of articles) {
        const hasContentAr = article.contentAr && article.contentAr.length > 50 && /[\u0600-\u06FF]/.test(article.contentAr);
        const hasSummaryAr = article.summaryAr && article.summaryAr.length > 10 && /[\u0600-\u06FF]/.test(article.summaryAr);
        
        if (!hasContentAr && !hasSummaryAr) {
          await db.newsItem.update({
            where: { id: article.id },
            data: {
              processingStage: 'fetched',
              aiAnalysis: null,
              generatedImage: null,
              titleAr: null,
              fetchedAt: new Date(), // Bring to front of queue
            }
          });
          resetCount++;
        }
      }
      return NextResponse.json({ success: true, message: `Reset ${resetCount} stuck articles.` });
    }

    return NextResponse.json({ success: true, message: 'Use ?action=reset-stuck to reset articles.' });
  } catch (e: any) {
    console.error('[diag-db] Error:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
