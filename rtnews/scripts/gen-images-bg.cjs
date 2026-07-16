// Background image generation script for infographics
// Processes one infographic at a time, saves after each
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
  'بنوك': 'banking finance', 'عقارات': 'real estate',
};
function getCtx(c) {
  if (!c) return 'finance business';
  if (SECTOR_MAP[c]) return SECTOR_MAP[c];
  for (const [k,v] of Object.entries(SECTOR_MAP)) { if (c.includes(k)||k.includes(c)) return v; }
  return 'finance business';
}

const TMPL = {
  hero: (ctx,c) => c ? `${c}, cinematic depth of field, no text, ultra detailed, 8k` : `Professional financial infographic background, dark navy blue with subtle ${ctx} abstract elements, gold and cyan accent lighting, cinematic depth of field, no text, ultra detailed, 8k`,
  story: (ctx,c) => c ? `${c}, glassmorphism effect, no text, ultra detailed, 8k` : `Professional business infographic background, dark navy blue with subtle ${ctx} connection lines and nodes, glassmorphism effect, gold accent lights, no text, ultra detailed, 8k`,
  data: (ctx,c) => c ? `${c}, abstract data streams, no text, ultra detailed, 8k` : `Professional data visualization background, dark navy blue with subtle ${ctx} chart elements, abstract data streams, gold and green accent, no text, ultra detailed, 8k`,
  scenarios: (ctx,c) => c ? `${c}, abstract geometric shapes, no text, ultra detailed, 8k` : `Professional scenario analysis background, dark navy blue with ${ctx} crossroads and decision paths, abstract geometric shapes, gold accent, no text, ultra detailed, 8k`,
  assets: (ctx,c) => c ? `${c}, gold and red accent, no text, ultra detailed, 8k` : `Professional financial assets background, dark navy blue with ${ctx} bull and bear market shapes, gold and red accent, no text, ultra detailed, 8k`,
};

async function uploadR2(key, buf) {
  try {
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
  } catch(e) { return null; }
}

async function genImage(prompt) {
  const ZAI = require('z-ai-web-dev-sdk').default;
  const zai = await ZAI.create();
  const resp = await zai.images.generations.create({ prompt, size: '1344x768' });
  const b64 = resp.data?.[0]?.base64;
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 5000) return null;
  return buf;
}

async function main() {
  const igId = process.argv[2];
  if (!igId) { console.log('Usage: node gen-images-bg.cjs <infographic-id>'); process.exit(1); }
  
  const ig = await prisma.infographic.findUnique({ where: { id: igId } });
  if (!ig) { console.log('Not found'); process.exit(1); }
  
  const slides = ig.slides || [];
  const context = getCtx(ig.category);
  console.log(`Processing: ${ig.title?.slice(0,50)} (sector: ${context})`);
  
  const needs = slides.filter(s => {
    if (s.type==='recommendations'||s.type==='summary') return false;
    const pos = s.image_position ?? s.content?.image_position;
    if (!pos) return false;
    const url = s.image_url || s.content?.image_url;
    return !url || url.includes('pollinations.ai');
  });
  
  console.log(`Need ${needs.length} images`);
  if (needs.length === 0) { console.log('All OK'); process.exit(0); }
  
  let gen = 0;
  for (const slide of needs) {
    const tmpl = TMPL[slide.type];
    if (!tmpl) continue;
    const custom = slide.image_prompt || slide.content?.image_prompt;
    const prompt = tmpl(context, custom);
    const start = Date.now();
    console.log(`  Slide ${slide.number} (${slide.type})...`);
    
    try {
      const buf = await genImage(prompt);
      if (buf) {
        const sid = `${slide.type}-${slide.number}-${Date.now().toString(36)}`;
        let url = await uploadR2(sid, buf);
        const final = url || `/api/infographic-image?path=slide-${sid}.png`;
        // Also save to /tmp as backup
        fs.writeFileSync(path.join(GENERATED_DIR, `slide-${sid}.png`), buf);
        slide.image_url = final;
        if (slide.content) slide.content.image_url = final;
        gen++;
        console.log(`  ✓ ${((Date.now()-start)/1000).toFixed(1)}s → ${final.slice(0,60)}`);
      } else {
        console.log(`  ✗ No image data`);
      }
    } catch(e) {
      console.log(`  ✗ ${e.message?.slice(0,60)}`);
    }
  }
  
  const allReady = slides.every(s => {
    if (s.type==='recommendations'||s.type==='summary') return true;
    const pos = s.image_position ?? s.content?.image_position;
    if (!pos) return true;
    const url = s.image_url || s.content?.image_url;
    return url && !url.includes('pollinations.ai');
  });
  
  const upd = { slides };
  if (allReady && !ig.isPublished) { upd.isPublished = true; upd.publishedAt = new Date(); console.log('AUTO-PUBLISHED!'); }
  await prisma.infographic.update({ where: { id: ig.id }, data: upd });
  console.log(`Done: ${gen}/${needs.length} generated, ${allReady ? 'ALL READY' : 'MISSING'}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
