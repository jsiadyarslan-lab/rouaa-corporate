// Fix all infographic images: Generate + Upload to R2
// Uses Pollinations as primary (1-5s per image) with SDK fallback
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: { 
    db: { url: 'postgresql://postgres.esghffynnmpeypnfsrbf:bM6jZ00bLE1xxNbX@aws-1-eu-west-1.pooler.supabase.com:5432/postgres' } 
  }
});

const GENERATED_DIR = '/tmp/rouaa-infographics';
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

const SECTOR_MAP = {
  'طاقة': 'oil energy', 'نفط': 'oil petroleum', 'اقتصاد': 'economy finance',
  'أسهم': 'stock market', 'تشفير': 'cryptocurrency', 'شركات': 'corporate',
  'أصول رقمية': 'cryptocurrency', 'سياحة': 'tourism', 'أجهزة': 'consumer appliances',
  'سلاسل التوريد': 'supply chain', 'عملات': 'currency forex',
  'بنوك': 'banking finance', 'عقارات': 'real estate', 'حروب': 'conflict defense',
};
function getCtx(c) {
  if (!c) return 'finance business';
  if (SECTOR_MAP[c]) return SECTOR_MAP[c];
  for (const [k,v] of Object.entries(SECTOR_MAP)) { if (c.includes(k)||k.includes(c)) return v; }
  return 'finance business';
}

const TMPL = {
  hero: (ctx,c) => c ? `${c}, cinematic depth of field, no text, ultra detailed, 8k` : `Professional financial infographic background, dark navy blue with subtle ${ctx} abstract elements, gold and cyan accent, cinematic depth of field, no text, ultra detailed, 8k`,
  story: (ctx,c) => c ? `${c}, glassmorphism effect, no text, ultra detailed, 8k` : `Professional business infographic background, dark navy blue with subtle ${ctx} connection lines and nodes, glassmorphism effect, gold accent, no text, ultra detailed, 8k`,
  data: (ctx,c) => c ? `${c}, abstract data streams, no text, ultra detailed, 8k` : `Professional data visualization background, dark navy blue with subtle ${ctx} chart elements, abstract data streams, gold and green accent, no text, ultra detailed, 8k`,
  scenarios: (ctx,c) => c ? `${c}, abstract geometric shapes, no text, ultra detailed, 8k` : `Professional scenario analysis background, dark navy blue with ${ctx} crossroads and decision paths, abstract geometric shapes, gold accent, no text, ultra detailed, 8k`,
  assets: (ctx,c) => c ? `${c}, gold and red accent, no text, ultra detailed, 8k` : `Professional financial assets background, dark navy blue with ${ctx} bull and bear market shapes, gold and red accent, no text, ultra detailed, 8k`,
};

async function uploadR2(key, buf) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId||!accessKeyId||!secretAccessKey||!bucketName||!publicUrl) return null;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  const s3Key = `article-images/infographic-${key}.png`;
  await client.send(new PutObjectCommand({
    Bucket: bucketName, Key: s3Key, Body: buf, ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000',
  }));
  return `${publicUrl.replace(/\/$/,'')}/${s3Key}`;
}

// Method 1: Pollinations (FAST: 1-5 seconds)
async function genPollinations(prompt) {
  try {
    const short = prompt.length > 300 ? prompt.substring(0, 297) + '...' : prompt;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(short)}?width=1344&height=768&nologo=true&seed=${Date.now()}&model=flux`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'RouaTradingNews/1.0', 'Accept': 'image/*' },
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 5000) return null;
    return buf;
  } catch { return null; }
}

// Method 2: SDK (SLOW: 25-35 seconds, but high quality)
async function genSDK(prompt) {
  try {
    const ZAI = require('z-ai-web-dev-sdk').default;
    const zai = await ZAI.create();
    const resp = await zai.images.generations.create({ prompt, size: '1344x768' });
    const b64 = resp.data?.[0]?.base64;
    if (!b64) return null;
    const buf = Buffer.from(b64, 'base64');
    if (buf.length < 5000) return null;
    return buf;
  } catch { return null; }
}

async function main() {
  console.log('=== Fixing All Infographic Images ===');
  
  const igs = await prisma.infographic.findMany({ orderBy: { createdAt: 'desc' } });
  let totalGen = 0, totalR2 = 0;
  
  for (const ig of igs) {
    const slides = ig.slides || [];
    const ctx = getCtx(ig.category);
    
    // Find slides needing images or with /tmp URLs
    const needsFix = slides.filter(s => {
      if (s.type==='recommendations'||s.type==='summary') return false;
      const pos = s.image_position ?? s.content?.image_position;
      if (!pos) return false;
      const url = s.image_url || s.content?.image_url;
      return !url || url.includes('pollinations.ai') || url.includes('/api/infographic-image');
    });
    
    if (needsFix.length === 0) continue;
    
    console.log(`\n--- ${ig.title?.slice(0,40)} --- ${needsFix.length} slides to fix (sector: ${ctx})`);
    
    for (const slide of needsFix) {
      const tmpl = TMPL[slide.type];
      if (!tmpl) continue;
      const custom = slide.image_prompt || slide.content?.image_prompt;
      const prompt = tmpl(ctx, custom);
      const slideId = `${slide.type}-${slide.number}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
      
      const start = Date.now();
      let buf = null;
      let method = 'none';
      
      // Try Pollinations first (FAST)
      buf = await genPollinations(prompt);
      if (buf) method = 'Pollinations';
      
      // Fallback to SDK if Pollinations fails
      if (!buf) {
        buf = await genSDK(prompt);
        if (buf) method = 'SDK';
      }
      
      if (buf) {
        // Save locally as backup
        const localPath = path.join(GENERATED_DIR, `slide-${slideId}.png`);
        fs.writeFileSync(localPath, buf);
        
        // Upload to R2 for persistence
        let url = await uploadR2(slideId, buf);
        if (url) {
          totalR2++;
          console.log(`  ✓ Slide ${slide.number} (${slide.type}) via ${method} in ${((Date.now()-start)/1000).toFixed(1)}s → R2`);
        } else {
          url = `/api/infographic-image?path=slide-${slideId}.png`;
          console.log(`  ✓ Slide ${slide.number} (${slide.type}) via ${method} in ${((Date.now()-start)/1000).toFixed(1)}s → /tmp (R2 not configured)`);
        }
        
        slide.image_url = url;
        if (slide.content) slide.content.image_url = url;
        totalGen++;
      } else {
        console.log(`  ✗ Slide ${slide.number} (${slide.type}) FAILED`);
      }
    }
    
    // Check and update
    const allReady = slides.every(s => {
      if (s.type==='recommendations'||s.type==='summary') return true;
      const pos = s.image_position ?? s.content?.image_position;
      if (!pos) return true;
      const url = s.image_url || s.content?.image_url;
      return url && !url.includes('pollinations.ai');
    });
    
    const upd = { slides };
    if (allReady && !ig.isPublished) {
      upd.isPublished = true;
      upd.publishedAt = new Date();
      console.log('  AUTO-PUBLISHED!');
    } else if (!allReady && ig.isPublished) {
      upd.isPublished = false;
      upd.publishedAt = null;
      console.log('  UNPUBLISHED (missing images)');
    }
    
    await prisma.infographic.update({ where: { id: ig.id }, data: upd });
  }
  
  console.log(`\n=== Done: ${totalGen} images generated, ${totalR2} uploaded to R2 ===`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
