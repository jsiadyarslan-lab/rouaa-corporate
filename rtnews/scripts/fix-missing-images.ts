// ═══════════════════════════════════════════════════════════════
// Fix Missing Images for Migrated Articles
// Generates Canvas/Sharp images for all published articles
// that have NULL or empty generatedImage after DB migration.
// ═══════════════════════════════════════════════════════════════

import { db } from '../src/lib/db';
import { uploadImageToR2 } from '../src/lib/image-storage';

const BATCH_SIZE = 50;
const MAX_ARTICLES = 5000; // Safety limit

async function fixMissingImages() {
  console.log('🔍 Finding published articles without images...');
  
  const articles = await db.newsItem.findMany({
    where: {
      isReady: true,
      isPublished: true,
      OR: [
        { generatedImage: null },
        { generatedImage: '' },
      ],
    },
    select: {
      id: true,
      title: true,
      titleAr: true,
      category: true,
      categoryId: true,
      locale: true,
      newsType: true,
      sentiment: true,
      sourceName: true,
      source: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: MAX_ARTICLES,
  });

  console.log(`Found ${articles.length} published articles without images`);

  if (articles.length === 0) {
    console.log('✅ No articles need image fixes');
    return;
  }

  // Import template engine
  const { generateArticleImage } = await import('../src/lib/image-templates/template-engine');
  
  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin
      ? (article.title || 'Breaking News')
      : (article.titleAr || article.title || 'أخبار عاجلة');
    const locale = isLatin ? (article.locale as 'ar' | 'en' | 'es' | 'fr' | 'tr') : 'ar';

    try {
      const canvasBuffer = await generateArticleImage({
        title,
        category: article.categoryId || article.category || 'economy',
        locale,
        newsType: article.newsType || undefined,
        sentiment: article.sentiment || undefined,
        source: article.sourceName || article.source || undefined,
      });

      if (canvasBuffer && canvasBuffer.length > 500) {
        // Try R2 first, fall back to base64
        let storedValue: string;
        const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
        if (r2Result.success) {
          storedValue = r2Result.url;
        } else {
          storedValue = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
        }

        await db.newsItem.update({
          where: { id: article.id },
          data: { generatedImage: storedValue },
        });

        fixed++;
        if (fixed % 10 === 0) {
          console.log(`✅ Fixed ${fixed}/${articles.length} images (${((fixed / articles.length) * 100).toFixed(1)}%)`);
        }
      } else {
        failed++;
        console.warn(`❌ Canvas generated too small buffer for ${article.id}`);
      }
    } catch (err: any) {
      failed++;
      console.error(`❌ Failed for ${article.id}: ${err.message?.slice(0, 80)}`);
    }

    // Small delay to not overload R2
    if (i > 0 && i % BATCH_SIZE === 0) {
      console.log(`⏳ Processed ${i}/${articles.length} — taking a short break...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n📊 Done! Fixed: ${fixed}, Failed: ${failed}, Total: ${articles.length}`);
}

fixMissingImages()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
