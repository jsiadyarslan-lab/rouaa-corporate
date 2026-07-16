import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function resetStuckArticles() {
  console.log('Resetting stuck articles that have missing Arabic translation...');
  
  // Find all articles that are fetched or analyzed but lack proper Arabic translation
  const articles = await db.newsItem.findMany({
    where: {
      isReady: false,
      processingStage: { in: ['fetched', 'translated', 'analyzed', 'imaged'] }
    }
  });

  console.log(`Found ${articles.length} total unready articles.`);

  let resetCount = 0;
  for (const article of articles) {
    const hasContentAr = article.contentAr && article.contentAr.length > 50 && /[\u0600-\u06FF]/.test(article.contentAr);
    const hasSummaryAr = article.summaryAr && article.summaryAr.length > 10 && /[\u0600-\u06FF]/.test(article.summaryAr);
    
    // If it lacks proper translation, reset it to fetched and clear aiAnalysis/generatedImage
    // so it gets a clean run through the pipeline
    if (!hasContentAr && !hasSummaryAr) {
      await db.newsItem.update({
        where: { id: article.id },
        data: {
          processingStage: 'fetched',
          aiAnalysis: null,
          generatedImage: null,
          titleAr: null, // Clear title to force re-translation
          fetchedAt: new Date(), // Bring to front of queue
        }
      });
      resetCount++;
    }
  }

  console.log(`Successfully reset ${resetCount} stuck articles to be re-processed.`);
}

resetStuckArticles()
  .catch(console.error)
  .finally(() => db.$disconnect());
