/**
 * Compare image data between Supabase (old) and Railway (new) databases
 * Find articles that need their images re-migrated
 */

const { Client } = require('pg');

const OLD_URL = 'postgresql://postgres.esghffynnmpeypnfsrbf:bM6jZ00bLE1xxNbX@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';
const NEW_URL = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@monorail.proxy.rlwy.net:22754/railway';

async function compare() {
  const old = new Client({ connectionString: OLD_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  const nw = new Client({ connectionString: NEW_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await old.connect();
  await nw.connect();

  console.log('=== Comparing Image Data: OLD (Supabase) vs NEW (Railway) ===\n');

  // 1. Basic counts
  const oldTotal = await old.query('SELECT COUNT(*) FROM news_items');
  const newTotal = await nw.query('SELECT COUNT(*) FROM news_items');
  console.log('Total articles - OLD:', oldTotal.rows[0].count, '| NEW:', newTotal.rows[0].count);

  // 2. In NEW DB: articles with NULL/empty generatedImage
  const newWithoutImg = await nw.query('SELECT id FROM news_items WHERE "generatedImage" IS NULL OR "generatedImage" = \'\'');
  console.log('\nNEW DB - articles WITHOUT generatedImage:', newWithoutImg.rows.length);

  // 3. Check how many of those exist in old DB WITH images
  const idsWithoutImg = newWithoutImg.rows.map(r => r.id);
  let needMigration = 0;
  let sampleIds = [];

  if (idsWithoutImg.length > 0) {
    const BATCH = 500;
    for (let i = 0; i < idsWithoutImg.length; i += BATCH) {
      const batch = idsWithoutImg.slice(i, i + BATCH);
      const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(',');
      const oldResult = await old.query(
        `SELECT id FROM news_items WHERE id IN (${placeholders}) AND "generatedImage" IS NOT NULL AND "generatedImage" != ''`,
        batch
      );
      needMigration += oldResult.rows.length;
      if (sampleIds.length < 10) sampleIds.push(...oldResult.rows.map(r => r.id));
    }
  }

  console.log('Articles in NEW DB missing generatedImage but have it in OLD DB:', needMigration);
  console.log('Sample IDs:', sampleIds);

  // 4. Also check: articles with imageUrl missing in NEW but present in OLD
  const newWithoutUrl = await nw.query('SELECT COUNT(*) FROM news_items WHERE "imageUrl" IS NULL OR "imageUrl" = \'\'');
  console.log('\nNEW DB - articles WITHOUT imageUrl:', newWithoutUrl.rows[0].count);

  // 5. Check processingStage distribution for articles missing generatedImage
  const missingImgStages = await nw.query('SELECT "processingStage", COUNT(*) as cnt FROM news_items WHERE "generatedImage" IS NULL OR "generatedImage" = \'\' GROUP BY "processingStage" ORDER BY cnt DESC');
  console.log('\nProcessing stages of articles missing generatedImage in NEW DB:');
  for (const r of missingImgStages.rows) {
    console.log('  ', r.processingStage + ':', r.cnt);
  }

  // 6. How many articles in NEW DB are NEW (not from old DB)
  const oldIds = await old.query('SELECT id FROM news_items');
  const newIds = await nw.query('SELECT id FROM news_items');
  const oldIdSet = new Set(oldIds.rows.map(r => r.id));
  const onlyInNew = newIds.rows.filter(r => !oldIdSet.has(r.id));
  console.log('\nArticles only in NEW DB (added after migration):', onlyInNew.length);

  // 7. Check how many in NEW DB have Pollinations imageUrl (broken - 402)
  const pollinationsUrls = await nw.query("SELECT COUNT(*) FROM news_items WHERE \"imageUrl\" LIKE '%pollinations.ai%'");
  console.log('Articles with Pollinations imageUrl (402 broken):', pollinationsUrls.rows[0].count);

  // 8. Check how many have R2 URLs in generatedImage (working)
  const r2Urls = await nw.query("SELECT COUNT(*) FROM news_items WHERE \"generatedImage\" LIKE '%r2.dev%'");
  console.log('Articles with R2 generatedImage (working):', r2Urls.rows[0].count);

  // 9. Verify a sample R2 URL from OLD DB still works
  const oldR2Sample = await old.query("SELECT id, \"generatedImage\" FROM news_items WHERE \"generatedImage\" LIKE '%r2.dev%' LIMIT 3");
  console.log('\nSample R2 URLs from OLD DB:');
  for (const r of oldR2Sample.rows) {
    console.log('  ID:', r.id, '| URL:', r.generatedImage);
  }

  await old.end();
  await nw.end();
  console.log('\n=== Comparison Complete ===');
}

compare().catch(e => console.error(e));
