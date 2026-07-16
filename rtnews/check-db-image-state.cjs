const { Client } = require('pg');

const RAILWAY_URL = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@monorail.proxy.rlwy.net:22754/railway';

async function check() {
  const client = new Client({
    connectionString: RAILWAY_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();

    // 1. Articles at 'imaged' but NOT published - check missing fields
    const imagedSample = await client.query(`
      SELECT id, locale,
        CASE WHEN "titleAr" IS NOT NULL AND "titleAr" != '' THEN 'Y' ELSE 'N' END as has_title_ar,
        CASE WHEN "contentAr" IS NOT NULL AND LENGTH("contentAr") > 100 THEN 'Y' ELSE 'N' END as has_content_ar,
        CASE WHEN "slug" IS NOT NULL AND "slug" != '' THEN 'Y' ELSE 'N' END as has_slug,
        CASE WHEN "generatedImage" IS NOT NULL AND "generatedImage" != '' THEN 'Y' ELSE 'N' END as has_img,
        CASE WHEN "aiAnalysis" IS NOT NULL AND "aiAnalysis" != '' THEN 'Y' ELSE 'N' END as has_ai,
        "isReady", "isPublished"
      FROM news_items
      WHERE "processingStage" = 'imaged' AND "isReady" = false
      LIMIT 10
    `);
    console.log('=== IMAGED BUT NOT PUBLISHED - Field Check ===');
    imagedSample.rows.forEach(r => {
      console.log(r.id.slice(0,10), '| locale:', r.locale, '| titleAr:', r.has_title_ar, '| contentAr:', r.has_content_ar, '| slug:', r.has_slug, '| img:', r.has_img, '| ai:', r.has_ai, '| ready:', r.isReady, '| pub:', r.isPublished);
    });

    // 2. Count how many imaged articles are missing critical fields
    const imagedMissing = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN "titleAr" IS NULL OR "titleAr" = '' THEN 1 END) as no_title_ar,
        COUNT(CASE WHEN "contentAr" IS NULL OR LENGTH("contentAr") < 100 THEN 1 END) as no_content_ar,
        COUNT(CASE WHEN "slug" IS NULL OR "slug" = '' THEN 1 END) as no_slug,
        COUNT(CASE WHEN "generatedImage" IS NULL OR "generatedImage" = '' THEN 1 END) as no_img,
        COUNT(CASE WHEN "aiAnalysis" IS NULL OR "aiAnalysis" = '' THEN 1 END) as no_ai
      FROM news_items
      WHERE "processingStage" = 'imaged' AND "isReady" = false
    `);
    console.log('\n=== IMAGED NOT PUBLISHED - Missing Fields ===');
    const m = imagedMissing.rows[0];
    console.log('Total:', m.total);
    console.log('No titleAr:', m.no_title_ar);
    console.log('No contentAr:', m.no_content_ar);
    console.log('No slug:', m.no_slug);
    console.log('No image:', m.no_img);
    console.log('No aiAnalysis:', m.no_ai);

    // 3. New articles without image - by stage
    const newNoImg = await client.query(`
      SELECT "processingStage", COUNT(*) as cnt
      FROM news_items
      WHERE "fetchedAt" > NOW() - INTERVAL '24 hours' AND ("generatedImage" IS NULL OR "generatedImage" = '')
      GROUP BY "processingStage" ORDER BY cnt DESC
    `);
    console.log('\n=== LAST 24H NO IMAGE - By Stage ===');
    newNoImg.rows.forEach(r => console.log('  ', r.processingStage, ':', r.cnt));

    // 4. Recent image types (last 48h)
    const recentImgTypes = await client.query(`
      SELECT
        CASE
          WHEN "generatedImage" LIKE '%pub-c4f0903409304444bcd7180e4b18d490%' THEN 'old_R2_bucket'
          WHEN "generatedImage" LIKE '%.r2.dev/%' THEN 'new_R2_bucket'
          WHEN "generatedImage" LIKE 'data:image/%' THEN 'base64_canvas'
          WHEN "generatedImage" LIKE '/article-images/%' THEN 'filesystem'
          WHEN "generatedImage" LIKE '%pollinations%' THEN 'pollinations'
          ELSE 'other'
        END as img_type,
        COUNT(*) as cnt
      FROM news_items
      WHERE "fetchedAt" > NOW() - INTERVAL '48 hours' AND "generatedImage" IS NOT NULL AND "generatedImage" != ''
      GROUP BY img_type ORDER BY cnt DESC
    `);
    console.log('\n=== RECENT 48H IMAGE TYPES ===');
    recentImgTypes.rows.forEach(r => console.log('  ', r.img_type, ':', r.cnt));

    // 5. Check if R2_PUBLIC_URL env var in current Railway deployment matches old bucket
    // Old bucket: pub-c4f0903409304444bcd7180e4b18d490.r2.dev
    // If new deployment has DIFFERENT R2 bucket, old URLs still work (they're on Cloudflare CDN)
    // but NEW images would go to new bucket

    // 6. Check the 136 analyzed articles - what's their lastError?
    const analyzedErrors = await client.query(`
      SELECT "lastError", COUNT(*) as cnt, locale
      FROM news_items
      WHERE "processingStage" = 'analyzed' AND "isReady" = false
      GROUP BY "lastError", locale ORDER BY cnt DESC LIMIT 10
    `);
    console.log('\n=== ANALYZED STAGE ERRORS ===');
    analyzedErrors.rows.forEach(r => console.log('  locale:', r.locale, '| count:', r.cnt, '| err:', (r.lastError || 'NULL').slice(0, 150)));

    // 7. Pipeline is clearly running (7438 new articles/24h) - so WHERE do images get lost?
    // Check: articles that are published but have NO image
    const publishedNoImgByLocale = await client.query(`
      SELECT locale, COUNT(*) as cnt
      FROM news_items
      WHERE "isReady" = true AND "isPublished" = true AND ("generatedImage" IS NULL OR "generatedImage" = '')
      GROUP BY locale ORDER BY cnt DESC
    `);
    console.log('\n=== PUBLISHED WITHOUT IMAGE - By Locale ===');
    publishedNoImgByLocale.rows.forEach(r => console.log('  ', r.locale, ':', r.cnt));

    await client.end();
  } catch(e) {
    console.error('Error:', e.code, '|', e.message?.slice(0,300));
    try { await client.end(); } catch(x) {}
  }
}
check();
