/**
 * Check detailed image status in Railway DB
 */
const { Client } = require('pg');

const NEW_URL = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@monorail.proxy.rlwy.net:22754/railway';

async function check() {
  const db = new Client({ connectionString: NEW_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await db.connect();

  // 1. The 2500 articles at 'imaged' stage WITHOUT generatedImage
  const imagedNoImg = await db.query(
    `SELECT id, LEFT(title, 60) as title, "processingStage", "isReady", "isPublished", locale
     FROM news_items
     WHERE "processingStage" = 'imaged' AND ("generatedImage" IS NULL OR "generatedImage" = '')
     LIMIT 20`
  );
  console.log('=== Articles at IMAGED stage WITHOUT generatedImage (sample) ===');
  for (const r of imagedNoImg.rows) {
    console.log('ID:', r.id, '| ready:', r.isReady, '| published:', r.isPublished, '| locale:', r.locale, '| title:', r.title);
  }

  // 2. How many published articles have broken Pollinations imageUrl?
  const publishedPollinations = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND "isPublished" = true AND "isReady" = true`
  );
  console.log('\nPublished articles with Pollinations imageUrl:', publishedPollinations.rows[0].count);

  // 3. Latest published AR articles with their image status
  const publishedWithImg = await db.query(
    `SELECT id, LEFT("generatedImage", 100) as genImg, LEFT("imageUrl", 100) as imgUrl, locale
     FROM news_items
     WHERE "isPublished" = true AND "isReady" = true AND locale = 'ar'
     ORDER BY "fetchedAt" DESC LIMIT 10`
  );
  console.log('\n=== Latest published AR articles (image status) ===');
  for (const r of publishedWithImg.rows) {
    console.log('ID:', r.id, '| genImg:', r.genImg || 'NULL', '| imgUrl:', r.imgUrl || 'NULL');
  }

  // 4. AR published articles with Pollinations imageUrl
  const arPublishedPollinations = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE "imageUrl" LIKE '%pollinations.ai%'
     AND "isPublished" = true AND "isReady" = true AND locale = 'ar'`
  );
  console.log('\nAR published articles with Pollinations imageUrl (shown on site):', arPublishedPollinations.rows[0].count);

  // 5. AR published articles using /api/article-image (no imageUrl)
  const arPublishedProxy = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE ("imageUrl" IS NULL OR "imageUrl" = '')
     AND "isPublished" = true AND "isReady" = true AND locale = 'ar'
     AND "generatedImage" IS NOT NULL AND "generatedImage" != ''`
  );
  console.log('AR published articles using /api/article-image proxy:', arPublishedProxy.rows[0].count);

  // 6. How many published articles have NO image at all?
  const publishedNoImage = await db.query(
    `SELECT COUNT(*) FROM news_items
     WHERE ("imageUrl" IS NULL OR "imageUrl" = '')
     AND ("generatedImage" IS NULL OR "generatedImage" = '')
     AND "isPublished" = true AND "isReady" = true AND locale = 'ar'`
  );
  console.log('AR published articles with NO image at all:', publishedNoImage.rows[0].count);

  await db.end();
}

check().catch(e => console.error(e));
