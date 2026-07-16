// ─── Generate Embeddings Script ─────────────────────────────
// Run with: npx tsx scripts/generate-embeddings.ts
// Generates and stores embeddings for all existing articles

import { generateEmbedding } from '../src/lib/embeddings';
import { db } from '../src/lib/db';

async function main() {
  console.log('🔄 Starting embedding generation...');
  
  const articles = await db.newsItem.findMany({
    where: { newsType: 'article', isPublished: true },
    select: { id: true, title: true, summary: true },
  });

  console.log(`📰 Found ${articles.length} articles to embed`);

  let processed = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const text = `${article.title} ${article.summary}`;
      const embedding = await generateEmbedding(text);
      
      // Store embedding in aiAnalysis JSON using _embedding key (consistent with embeddings.ts)
      // Version 2 format: { _embedding: [...], _embeddingVersion: 2 }
      const existing = await db.newsItem.findUnique({ where: { id: article.id } });
      if (existing?.aiAnalysis) {
        const analysis = JSON.parse(existing.aiAnalysis);
        analysis._embedding = embedding;
        analysis._embeddingVersion = 2;
        await db.newsItem.update({
          where: { id: article.id },
          data: { aiAnalysis: JSON.stringify(analysis) },
        });
      } else {
        await db.newsItem.update({
          where: { id: article.id },
          data: { aiAnalysis: JSON.stringify({ _embedding: embedding, _embeddingVersion: 2 }) },
        });
      }

      processed++;
      if (processed % 10 === 0) {
        console.log(`✅ Processed ${processed}/${articles.length}`);
      }
    } catch (err) {
      failed++;
      console.error(`❌ Failed for article ${article.id}:`, err);
    }
  }

  console.log(`\n✨ Complete! Processed: ${processed}, Failed: ${failed}`);
  await db.$disconnect();
}

main().catch(console.error);
