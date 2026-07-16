import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  // V47: Auth — require ADMIN_SECRET or INTERNAL_SECRET, no hardcoded fallbacks
  const adminSecret = process.env.ADMIN_SECRET;
  const internalSecret = process.env.INTERNAL_SECRET || adminSecret;
  const isQueryValid = adminSecret ? secret === adminSecret : false;
  const isInternalValid = internalSecret ? secret === internalSecret : false;
  if (!isQueryValid && !isInternalValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureTablesExist();
    
    // First, add the processingStage column if it doesn't exist
    try {
      await db.$executeRawUnsafe(`ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "processingStage" TEXT DEFAULT 'fetched'`);
    } catch {}
    
    // Add the index if it doesn't exist
    try {
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS news_items_processingStage_idx ON news_items("processingStage")`);
    } catch {}
    
    const results = {
      imaged: 0,
      analyzed: 0,
      translated: 0,
      fetched: 0,
      unreadyUnpublished: 0,
      total: 0,
    };
    
    // Get all articles — EGRESS FIX: use processingStage instead of pulling generatedImage
    const allArticles = await db.newsItem.findMany({
      select: {
        id: true,
        titleAr: true,
        slug: true,
        contentAr: true,
        aiAnalysis: true,
        // EGRESS FIX: removed generatedImage from select — use processingStage instead
        processingStage: true,
        isReady: true,
        isPublished: true,
      },
    });
    
    results.total = allArticles.length;
    
    for (const article of allArticles) {
      const hasTitleAr = !!(article.titleAr && article.titleAr.length > 3 && /[\u0600-\u06FF]/.test(article.titleAr));
      const hasSlug = !!article.slug;
      const hasContentAr = !!(article.contentAr && article.contentAr.length > 50 && /[\u0600-\u06FF]/.test(article.contentAr));
      
      let hasRealAnalysis = false;
      try {
        if (article.aiAnalysis && article.aiAnalysis.length > 50) {
          const parsed = JSON.parse(article.aiAnalysis);
          const isMinimal = parsed.isMinimal === true || parsed.isSummaryFallback === true;
          const hasRealBody = !!(parsed.body && parsed.body.length > 30) || !!(parsed.fullContent && parsed.fullContent.length > 100);
          hasRealAnalysis = !isMinimal && hasRealBody;
        }
      } catch {}
      
      // EGRESS FIX: use processingStage instead of generatedImage to determine if image exists
      const hasImage = article.processingStage === 'imaged';
      
      let stage = 'fetched';
      if (hasImage && hasRealAnalysis && hasContentAr && hasTitleAr && hasSlug) {
        stage = 'imaged';
      } else if (hasRealAnalysis && hasContentAr && hasTitleAr && hasSlug) {
        stage = 'analyzed';
      } else if (hasContentAr && hasTitleAr && hasSlug) {
        stage = 'translated';
      } else if (hasTitleAr && hasSlug) {
        stage = 'fetched';
      }
      
      // V38: isReady=true ONLY for imaged articles (fully complete)
      // isPublished=true ONLY for imaged articles (fully complete)
      // Incomplete articles are HIDDEN: isReady=false, isPublished=false
      const isReady = stage === 'imaged';
      const isPublished = stage === 'imaged';  // V38: Only complete articles are "published"
      
      // V38: For articles that are isReady=false but isPublished=true, fix them
      if (!isReady && article.isPublished) {
        results.unreadyUnpublished++;
      }
      
      await db.newsItem.update({
        where: { id: article.id },
        data: { processingStage: stage, isReady, isPublished },
      });
      
      results[stage as keyof typeof results] = (results[stage as keyof typeof results] as number) + 1;
    }
    
    return NextResponse.json({ success: true, results, message: `V38 migration complete. ${results.unreadyUnpublished} incomplete articles hidden from site.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
