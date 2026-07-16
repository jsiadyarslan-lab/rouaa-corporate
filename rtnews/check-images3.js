/**
 * Check if Pollinations articles also have R2 generatedImage
 */
const { Client } = require('pg');

const NEW_URL = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@monorail.proxy.rlwy.net:22754/railway';

async function check() {
  const db = new Client({ connectionString: NEW_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await db.connect();

  // 1. Pollinations articles that ALSO have R2 generatedImage
  const pollWithR2 = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND "generatedImage" LIKE '%r2.dev%'`
  );
  console.log('Pollinations articles ALSO having R2 generatedImage:', pollWithR2.rows[0].count);

  // 2. Pollinations articles WITHOUT generatedImage
  const pollWithoutGen = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND ("generatedImage" IS NULL OR "generatedImage" = '')`
  );
  console.log('Pollinations articles WITHOUT generatedImage:', pollWithoutGen.rows[0].count);

  // 3. Pollinations articles with base64 generatedImage
  const pollWithBase64 = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND "generatedImage" IS NOT NULL AND "generatedImage" != ''
     AND "generatedImage" NOT LIKE '%r2.dev%'
     AND "generatedImage" NOT LIKE 'http%'`
  );
  console.log('Pollinations articles with base64 generatedImage:', pollWithBase64.rows[0].count);

  // 4. What does the frontend actually see?
  // The live API uses: imageUrl: item.imageUrl || `/api/article-image/${id}`
  // So if imageUrl is set (Pollinations), it takes priority over the proxy!
  // This means even if generatedImage has a working R2 URL, the frontend shows Pollinations (broken)
  const affectedOnSite = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND "generatedImage" LIKE '%r2.dev%'
     AND "isPublished" = true AND "isReady" = true AND locale = 'ar'`
  );
  console.log('\n*** CRITICAL: AR published articles where Pollinations URL overrides working R2 URL:', affectedOnSite.rows[0].count, '***');

  // 5. Sample of these affected articles
  const sample = await db.query(
    `SELECT id, LEFT("generatedImage", 100) as genImg, LEFT("imageUrl", 80) as imgUrl
     FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND "generatedImage" LIKE '%r2.dev%'
     AND "isPublished" = true AND "isReady" = true AND locale = 'ar'
     LIMIT 5`
  );
  console.log('\nSample affected articles:');
  for (const r of sample.rows) {
    console.log('ID:', r.id, '| genImg:', r.genImg, '| imgUrl:', r.imgUrl);
  }

  // 6. Articles with no image at all (published, AR) - need image generation
  const noImgAtAll = await db.query(
    `SELECT id, LEFT(title, 60) as title, "processingStage"
     FROM news_items
     WHERE ("imageUrl" IS NULL OR "imageUrl" = '')
     AND ("generatedImage" IS NULL OR "generatedImage" = '')
     AND "isPublished" = true AND "isReady" = true AND locale = 'ar'
     ORDER BY "fetchedAt" DESC LIMIT 10`
  );
  console.log('\nAR published articles with NO image at all:');
  for (const r of noImgAtAll.rows) {
    console.log('ID:', r.id, '| stage:', r.processingStage, '| title:', r.title);
  }

  await db.end();
}

check().catch(e => console.error(e));
