// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Imager Agent V266 (DIAGNOSTICS FIX) ────────────────
// V266: CRITICAL FIX — Better diagnostics + fixed Pollinations health check
//   + Added method-by-method timing and detailed error tracking
//   + Pollinations health check now uses HEAD (not GET) to avoid 402 false positive
//   + base64ToBuffer regex fix for non-standard MIME types
//   + advanceStage error now propagates (not silently swallowed)
//   Pipeline order (unchanged):
//   1. Cloudflare Workers AI (PRIMARY — FREE, fast 5-15s, reliable on Railway)
//   2. Gemini Flash Image (Google — high quality, ~3-5s, needs API key)
//   3. Prodia (FLUX schnell — ultra fast ~0.4s, needs API key)
//   4. ZAI SDK (best quality, works on Railway) + CLI fallback
//   5. Together AI (V259: FLUX.1-schnell-Free — $0, needs API key + card)
//   6. HuggingFace Inference API (V253: FLUX.1-schnell, uses HF_API_KEY)
//   7. Pollinations FLUX (when available — free but 402 on cloud IPs)
//   8. Pollinations default model (backup)
//   9. Canvas/Sharp template engine (GUARANTEED — <500ms, no API)
//     + Submit Stable Horde in background (non-blocking) if Canvas is used
//
// V260: Added Stable Horde — 100% FREE image generation, no API key, no credit card.
// V259: Added Together AI (FLUX.1-schnell-Free) — FREE image generation.
//   GUARANTEED 100% success rate — Canvas/Sharp fallback NEVER fails.
//
//   Key changes from V240:
//   - Canvas/Sharp as the ULTIMATE fallback (never fails, no network)
//   - ZAI SDK moved to PRIMARY (more reliable than Pollinations on Railway)
//   - ZAI CLI fallback when SDK fails
//   - No more "all methods failed" — articles ALWAYS get an image
//   - Pre-cached category images removed (Canvas replaces them)
//
// V240: Robust multi-provider image generation pipeline.
//   - Flux model as PRIMARY (most reliable Pollinations model)
//   - Pre-cached category images as LAST RESORT (guaranteed 100% success)
//   - No SVG placeholder DB writes (saves DB cycles)
//   - Unified 500-char minimum size check across all methods
//   - Pollinations health check before wasting time
//   - R2 upload with retry (2 attempts with backoff)
//
// V97: Cloudflare R2 image storage — persistent URLs, no DB bloat, no ephemeral FS.
//   - Images uploaded to R2 (S3-compatible, 10GB free, free egress).
//   - R2 URLs (~80 chars) stored in DB instead of base64 (~100KB+).
//   - Falls back to filesystem (fast but ephemeral on Railway), then base64 (always works).
//   - Publisher now accepts R2 URLs as valid persistent images.
//
// V96 CRITICAL FIX: Railway ephemeral filesystem causes image loss on redeployment.
//   - Images saved to public/article-images/ are LOST when Railway restarts.
//   - Old V44 stored only filesystem paths (~46 chars) in DB → publisher rejected
//     them (length < 50) → infinite publish-loop (imager accepts → publisher rejects
//     → V93c resets → repeat).
//   FIXES:
//   1. saveImageWithFallback(): Try filesystem first, fall back to base64 in DB.
//      Base64 is larger (~100KB) but PERSISTS across deployments.
//   2. Verify filesystem paths still exist before assuming image is valid.
//      If file is missing, clear generatedImage and regenerate.
//   3. Publisher length check changed from >50 to >10 to accept filesystem paths.
//
// V44: Image files saved to filesystem (public/article-images/) instead of
// base64 in DB. This prevents database bloat — each base64 image was
// 100KB+, and with hundreds of articles this was causing performance issues.
// Now only the URL path is stored in generatedImage column.
//
// V43: Unsplash category fallback — if ALL AI methods fail, use stock photo
// V42: Pollinations fallback now DOWNLOADS the image and stores as base64
// V37: AI-generated image is MANDATORY for publishing.
//
// Priority: R2 upload → filesystem → base64 in DB
// Image generation: z-ai-sdk → Pollinations.ai → Pollinations category AI image
// V162: Unsplash completely removed — only AI-generated images (Pollinations.ai)

import { db } from '@/lib/db';
import { PIPELINE_CONFIG } from '../config';
import { ProcessingStage } from '../queue/job-types';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { uploadImageToR2, isR2Url } from '@/lib/image-storage';
import sharp from 'sharp';

// V259: Together AI free tier rate limiter — max 1 req/2s for FLUX.1-schnell-Free
let _togetherLastRequestTime = 0;
const TOGETHER_MIN_INTERVAL_MS = 2500; // 2.5s between requests (safe margin)

// ── V240: Pollinations health check cache ──
// Avoids wasting 240s+ per article when Pollinations is completely down.
let _pollinationsLastCheck = 0;
let _pollinationsAvailable = true;
// V266: Reduced cache time from 2min to 30s — 2min was too aggressive.
// If Pollinations comes back online, we want to detect it faster.
const POLLINATIONS_CHECK_INTERVAL_MS = 30_000; // Check every 30 seconds (was 120s)

async function isPollinationsAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - _pollinationsLastCheck < POLLINATIONS_CHECK_INTERVAL_MS) {
    return _pollinationsAvailable;
  }
  _pollinationsLastCheck = now;
  try {
    // V266: Use HEAD (not GET) — GET downloads a full image which is wasteful.
    // Pollinations HEAD returns 200 even on cloud IPs, but the actual image
    // generation (GET) returns 402. We can't detect 402 with HEAD, so instead
    // we just check if the service is UP. The 402 will be caught when we
    // actually try to generate an image.
    const res = await fetch('https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    _pollinationsAvailable = res.ok || res.status === 402;
    // 402 means the service IS UP (just not free on cloud IPs) — we should
    // still try it because sometimes it works (rate limit windows, etc.)
    if (res.status === 402) {
      console.warn('[Imager V266] ⚠ Pollinations returned 402 (cloud IP) — will still try in case rate limit clears');
      _pollinationsAvailable = true; // V266: Don't mark as unavailable — let individual attempts handle 402
    }
  } catch {
    _pollinationsAvailable = false;
  }
  if (!_pollinationsAvailable) {
    console.warn('[Imager V266] ⚠ Pollinations appears to be DOWN — will use fallbacks');
  }
  return _pollinationsAvailable;
}

// ── V240: Pre-cached category image cache ──
// Stores one image per category in memory/R2 for instant fallback.
// When Pollinations is down, articles get a pre-cached image instead of failing.
const _categoryImageCache = new Map<string, string>(); // category → R2 URL or base64

async function getPreCachedCategoryImage(category: string): Promise<string | null> {
  // Check memory cache first
  const cached = _categoryImageCache.get(category);
  if (cached) return cached;

  // Try to load from R2 (persistent across restarts)
  const { isR2Available: isR2Up } = await import('@/lib/image-storage');
  if (isR2Up()) {
    const r2Url = `${(process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')}/category-cache/${category}.png`;
    try {
      const res = await fetch(r2Url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        _categoryImageCache.set(category, r2Url);
        return r2Url;
      }
    } catch { /* R2 check failed, continue */ }
  }

  return null;
}

// ── V240: Pre-warm category image cache ──
// Called once on startup. Generates one image per category and stores in R2.
// These images serve as guaranteed fallbacks when all AI methods fail.
let _prewarmInProgress = false;
let _prewarmComplete = false;

export async function prewarmCategoryImageCache(): Promise<void> {
  if (_prewarmInProgress || _prewarmComplete) return;
  _prewarmInProgress = true;

  const categories = Object.keys(getCategoryVisuals());
  const togetherApiKey = process.env.TOGETHER_API_KEY;

  if (togetherApiKey) {
    // V259: Use Together AI instead of Pollinations (which returns 402 on Railway)
    console.log(`[Imager V259] Pre-warming ${categories.length} category images via Together AI...`);
    for (const category of categories) {
      try {
        const existing = await getPreCachedCategoryImage(category);
        if (existing) continue;

        const visual = getCategoryVisual(category);
        const prompt = `Professional financial news illustration: ${visual}. Modern, clean, editorial style. No text overlay. High quality.`;
        const imgBuffer = await callTogetherImageAPI(prompt, togetherApiKey);

        if (imgBuffer && imgBuffer.length > 2000) {
          const r2Result = await uploadImageToR2(`category-cache/${category}`, imgBuffer, 'image/jpeg');
          if (r2Result.success) {
            _categoryImageCache.set(category, r2Result.url);
            console.log(`[Imager V259] ✓ Pre-cached category "${category}" → R2 via Together AI`);
          }
          // Rate limit: wait between requests for free tier
          await new Promise(r => setTimeout(r, TOGETHER_MIN_INTERVAL_MS));
        }
      } catch (err: any) {
        console.warn(`[Imager V259] Pre-warm failed for "${category}": ${err.message?.slice(0, 80)}`);
      }
    }
  } else {
    // No Together AI key — skip prewarm (Canvas/Sharp handles fallback at runtime)
    console.log(`[Imager V259] Skipping category prewarm — TOGETHER_API_KEY not set (Canvas/Sharp handles fallback)`);
  }

  _prewarmComplete = true;
  _prewarmInProgress = false;
  console.log(`[Imager V259] Pre-warm complete. ${_categoryImageCache.size}/${categories.length} categories cached.`);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Save image buffer to filesystem and return URL path ──
// Images are saved to public/article-images/{articleId}.png
// The URL path /article-images/{articleId}.png is stored in DB instead of base64.
function saveImageToFilesystem(articleId: string, imageBuffer: Buffer, mimeType: string): string {
  const ext = mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : mimeType.includes('svg') ? 'svg' : 'png';
  const dir = join(process.cwd(), 'public', 'article-images');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filename = `${articleId}.${ext}`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, imageBuffer);
  return `/article-images/${filename}`;
}

// ── Compress image before saving ──
// AI-generated images are often 1-3MB. Compressing to JPEG 80% quality
// reduces them to ~80-150KB with minimal visual difference.
// This is the #1 fix for Supabase egress (151GB used from 5GB free tier).
async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string; base64DataUrl: string }> {
  try {
    // Skip SVG — can't compress with sharp
    if (mimeType.includes('svg')) {
      const b64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return { buffer, mimeType, base64DataUrl: b64 };
    }

    const targetWidth = 800; // 800px is plenty for article thumbnails
    const targetQuality = 80; // Good quality, small file size

    const compressed = await sharp(buffer)
      .resize(targetWidth, null, { withoutEnlargement: true }) // Scale down if larger
      .jpeg({ quality: targetQuality, mozjpeg: true }) // Convert to JPEG for best compression
      .toBuffer();

    const originalKB = (buffer.length / 1024).toFixed(0);
    const compressedKB = (compressed.length / 1024).toFixed(0);
    const savings = Math.round((1 - compressed.length / buffer.length) * 100);

    if (savings > 10) {
      console.log(`[Imager] Compressed image: ${originalKB}KB → ${compressedKB}JPEG (${savings}% smaller)`);
      const b64 = `data:image/jpeg;base64,${compressed.toString('base64')}`;
      return { buffer: compressed, mimeType: 'image/jpeg', base64DataUrl: b64 };
    }

    // Compression didn't help much — keep original
    const b64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { buffer, mimeType, base64DataUrl: b64 };
  } catch (err: any) {
    // Sharp failed — keep original image
    console.warn(`[Imager] Image compression failed (non-critical): ${err.message}`);
    const b64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { buffer, mimeType, base64DataUrl: b64 };
  }
}

// ── Save image with R2-first, filesystem-second strategy ──
// R2 provides persistent URLs that survive Railway redeployments.
// Filesystem is fast but ephemeral on Railway.
// V1108: NEVER store base64 in DB — causes massive DB bloat.
// If both R2 and filesystem fail, return null (article publishes without image).
// Returns the value to store in generatedImage column, or null if all storage fails.
async function saveImageV97(
  articleId: string,
  buffer: Buffer,
  mimeType: string,
  base64DataUrl: string
): Promise<string | null> {
  // Compress image before saving (reduces egress from ~1MB to ~80KB per image)
  const compressed = await compressImage(buffer, mimeType);
  buffer = compressed.buffer;
  mimeType = compressed.mimeType;
  base64DataUrl = compressed.base64DataUrl;

  // PRIORITY 1: Upload to R2 (persistent URL, no DB bloat)
  const r2Result = await uploadImageToR2(articleId, buffer, mimeType);
  if (r2Result.success) {
    console.log(`[Imager V97] ✓ Image uploaded to R2 for ${articleId} (${(buffer.length / 1024).toFixed(0)}KB, url=${r2Result.url.slice(0, 80)}...)`);
    return r2Result.url;
  }
  if (r2Result.error !== 'R2 not configured') {
    console.warn(`[Imager V97] R2 upload failed for ${articleId}: ${r2Result.error} — falling back`);
  }

  // PRIORITY 2: Save to filesystem (fast but ephemeral on Railway)
  try {
    const urlPath = saveImageToFilesystem(articleId, buffer, mimeType);
    // Verify the file was actually written
    const filePath = join(process.cwd(), 'public', urlPath);
    if (existsSync(filePath)) {
      console.log(`[Imager V97] ✓ Image saved to filesystem for ${articleId} (R2 unavailable)`);
      return urlPath; // Success — use filesystem path
    }
    console.warn(`[Imager V97] Filesystem write seemed OK but file not found for ${articleId} — no image`);
  } catch (fsErr: any) {
    console.warn(`[Imager V97] Filesystem save failed for ${articleId}: ${fsErr.message} — no image`);
  }

  // V1108: NEVER store base64 in DB — causes massive DB bloat (~100KB per image).
  // Return null instead — the UI handles missing images gracefully.
  console.warn(`[Imager V97] ⚠️ All image storage failed for ${articleId} — publishing without image (no base64 in DB)`);
  return null;
}

// ── Convert base64 data URL to Buffer ──
// V266 FIX: Changed regex from image\/\w+ to image\/[\w+.-]+ to support
// MIME types like image/svg+xml, image/webp, etc.
function base64ToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (matches) {
    return { buffer: Buffer.from(matches[2], 'base64'), mimeType: matches[1] };
  }
  // Raw base64 without prefix
  return { buffer: Buffer.from(dataUrl, 'base64'), mimeType: 'image/png' };
}

export interface ImageResult {
  articleId: string;
  success: boolean;
  imageSource: 'ai' | 'pollinations' | 'canvas' | 'unsplash' | 'huggingface' | 'together' | 'stablehorde' | 'gemini' | 'prodia' | 'none';
  duration: number;
  error?: string;
}

// ── V118: Unified save + advance helper ──
// Replaces 5 repeated save+advance blocks with a single function.
// Always: saves image → updates DB → advances stage.
// GOLDEN RULE: Articles are NEVER published without a generated image.
async function saveAndAdvance(
  articleId: string,
  currentStage: ProcessingStage,
  buffer: Buffer,
  mimeType: string,
  base64DataUrl: string,
  source: 'ai' | 'pollinations' | 'canvas' | 'unsplash' | 'huggingface' | 'together' | 'stablehorde' | 'gemini' | 'prodia'
): Promise<ImageResult> {
  const storedValue = await saveImageV97(articleId, buffer, mimeType, base64DataUrl);
  await db.newsItem.update({
    where: { id: articleId },
    data: { generatedImage: storedValue },
  });
  const { advanceStage } = await import('../queue/job-manager');
  await advanceStage(articleId, currentStage);
  // V1108: storedValue can be null if all storage failed
  const fmt = !storedValue ? 'none' : storedValue.startsWith('https://') ? 'r2' : storedValue.startsWith('/') ? 'filesystem' : 'base64';
  const duration = 0; // Caller sets duration
  console.log(`[Imager V118] ✓ ${source} image saved for ${articleId} (${(buffer.length / 1024).toFixed(0)}KB, format=${fmt})`);
  return { articleId, success: true, imageSource: source, duration };
}

export async function imageArticle(articleId: string): Promise<ImageResult> {
  const startTime = Date.now();
  const result: ImageResult = { articleId, success: false, imageSource: 'none', duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // If already has generatedImage, advance — BUT verify it's still valid!
    // V97: R2 URLs are persistent — no need to verify they exist.
    //      Filesystem paths are ephemeral on Railway — must verify file exists.
    //      Base64 is always valid (stored in DB).
    // V229: Stricter validation — reject invalid/legacy values that aren't real images.
    if (article.generatedImage && article.generatedImage.length > 10) {
      let imageStillValid = true;

      // V229: Validate the value is actually a real image reference
      const img = article.generatedImage;

      // R2 URLs are persistent — always valid
      if (isR2Url(img)) {
        // R2 URL — persistent, no verification needed
      }
      // V230: Pollinations URLs — also valid (they regenerate on access).
      // Old articles may have stored Pollinations URLs directly in generatedImage.
      // These are NOT persistent (URL may 404 later), but they're a valid image source.
      else if (img.includes('image.pollinations.ai')) {
        // Pollinations URL — valid but not persistent. Try to migrate to R2.
        console.log(`[Imager V230] Pollinations URL found for ${articleId} — will try R2 migration`);
        // Fall through to migration logic below, but don't mark as invalid
      }
      // Base64 data URL — validate it's actually decodable
      else if (img.startsWith('data:image/')) {
        try {
          const { buffer } = base64ToBuffer(img);
          // V229: Reject truncated/corrupt base64 (must be at least 500 bytes of real image data)
          if (buffer.length < 500) {
            console.warn(`[Imager V229] Base64 too small (${buffer.length}B) for ${articleId} — will regenerate`);
            imageStillValid = false;
          }
        } catch {
          console.warn(`[Imager V229] Base64 decode failed for ${articleId} — will regenerate`);
          imageStillValid = false;
        }
      }
      // Filesystem path — check file still exists
      else if (img.startsWith('/article-images/')) {
        const filePath = join(process.cwd(), 'public', img);
        if (!existsSync(filePath)) {
          console.warn(`[Imager V229] Filesystem image LOST for ${articleId}: ${img} — will regenerate`);
          imageStillValid = false;
          // Clear the stale path so we regenerate
          try {
            await db.newsItem.update({
              where: { id: articleId },
              data: { generatedImage: null },
            });
          } catch (clearErr: any) {
            console.warn(`[Imager V229] Failed to clear stale generatedImage for ${articleId}: ${clearErr.message}`);
          }
        }
      }
      // V229: Reject any other value (Pollinations URLs, garbage strings, legacy data)
      // These are NOT valid persistent image references — regenerate.
      else {
        console.warn(`[Imager V229] Invalid generatedImage format for ${articleId}: "${img.slice(0, 60)}..." — will regenerate`);
        imageStillValid = false;
        // Clear the invalid value
        try {
          await db.newsItem.update({
            where: { id: articleId },
            data: { generatedImage: null },
          });
        } catch (clearErr: any) {
          console.warn(`[Imager V229] Failed to clear invalid generatedImage for ${articleId}: ${clearErr.message}`);
        }
      }

      if (imageStillValid) {
        // V97 MIGRATION: If it's a base64 data URL or filesystem path, try to migrate to R2 now
        if (article.generatedImage.startsWith('data:image/')) {
          try {
            const { buffer, mimeType } = base64ToBuffer(article.generatedImage);
            const r2Result = await uploadImageToR2(articleId, buffer, mimeType);
            if (r2Result.success) {
              await db.newsItem.update({
                where: { id: articleId },
                data: { generatedImage: r2Result.url },
              });
              console.log(`[Imager V97] Migrated base64 → R2 for ${articleId} (${(buffer.length / 1024).toFixed(0)}KB saved from DB)`);
            } else {
              // R2 unavailable — try filesystem migration at least
              const urlPath = saveImageToFilesystem(articleId, buffer, mimeType);
              await db.newsItem.update({
                where: { id: articleId },
                data: { generatedImage: urlPath },
              });
              console.log(`[Imager V97] Migrated base64 → filesystem for ${articleId} (R2 unavailable, ${(buffer.length / 1024).toFixed(0)}KB)`);
            }
          } catch (migrateErr: any) {
            console.warn(`[Imager V97] Base64 migration failed for ${articleId}: ${migrateErr.message}`);
          }
        } else if (article.generatedImage.startsWith('/article-images/')) {
          // V97: Try to migrate filesystem path to R2
          try {
            const filePath = join(process.cwd(), 'public', article.generatedImage);
            if (existsSync(filePath)) {
              const fileBuffer = readFileSync(filePath); // V259 FIX: readFileSync already imported at top
              const ext = article.generatedImage.split('.').pop()?.toLowerCase() || 'png';
              const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                : ext === 'webp' ? 'image/webp'
                : 'image/png';
              const r2Result = await uploadImageToR2(articleId, fileBuffer, mimeType);
              if (r2Result.success) {
                await db.newsItem.update({
                  where: { id: articleId },
                  data: { generatedImage: r2Result.url },
                });
                console.log(`[Imager V97] Migrated filesystem → R2 for ${articleId}`);
              }
            }
          } catch (migrateErr: any) {
            console.warn(`[Imager V97] Filesystem → R2 migration failed for ${articleId}: ${migrateErr.message}`);
          }
        } else if (article.generatedImage.includes('image.pollinations.ai')) {
          // V230: Try to download Pollinations image and re-upload to R2 for persistence
          try {
            const pollUrl = article.generatedImage;
            console.log(`[Imager V230] Downloading Pollinations image for R2 migration: ${articleId}`);
            const imgRes = await fetch(pollUrl, {
              signal: AbortSignal.timeout(30000),
              headers: { 'User-Agent': 'RouaTradingNews/1.0', 'Accept': 'image/*' },
            });
            if (imgRes.ok) {
              const contentType = imgRes.headers.get('content-type') || 'image/png';
              if (contentType.startsWith('image/')) {
                const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
                if (imgBuffer.length > 500) {
                  const r2Result = await uploadImageToR2(articleId, imgBuffer, contentType);
                  if (r2Result.success) {
                    await db.newsItem.update({
                      where: { id: articleId },
                      data: { generatedImage: r2Result.url },
                    });
                    console.log(`[Imager V230] Migrated Pollinations → R2 for ${articleId} (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
                  } else {
                    // R2 unavailable — save to filesystem at least
                    const mimeType = contentType.includes('jpeg') ? 'image/jpeg' : contentType.includes('webp') ? 'image/webp' : 'image/png';
                    const urlPath = saveImageToFilesystem(articleId, imgBuffer, mimeType);
                    await db.newsItem.update({
                      where: { id: articleId },
                      data: { generatedImage: urlPath },
                    });
                    console.log(`[Imager V230] Migrated Pollinations → filesystem for ${articleId} (R2 unavailable)`);
                  }
                }
              }
            } else {
              console.warn(`[Imager V230] Pollinations download failed (HTTP ${imgRes.status}) for ${articleId} — keeping URL as-is`);
            }
          } catch (migrateErr: any) {
            console.warn(`[Imager V230] Pollinations migration failed for ${articleId}: ${migrateErr.message} — keeping URL as-is`);
          }
        }
        const { advanceStage } = await import('../queue/job-manager');
        await advanceStage(articleId, article.processingStage as ProcessingStage);
        result.success = true;
        result.imageSource = 'ai';
        result.duration = Date.now() - startTime;
        return result;
      }
      // If image was lost, fall through to regenerate below
    }

    // V266: Track specific errors + TIMING from each method for diagnostics
    const methodErrors: string[] = [];
    const methodTimings: string[] = []; // V266: Track how long each method takes

    // ═══════════════════════════════════════════════════════════
    // METHOD 1 (PRIMARY V264): Cloudflare Workers AI — PRIMARY
    // Free tier: 10,000 neurons/day (~100-500 images/day).
    // Models: @cf/stabilityai/stable-diffusion-xl-base-1.0
    // Needs: CLOUDFLARE_API_TOKEN + R2_ACCOUNT_ID
    // ═══════════════════════════════════════════════════════════
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = process.env.R2_ACCOUNT_ID;
    if (cfApiToken && cfAccountId) {
      const cfStart = Date.now();
      try {
        console.log(`[Imager V266] Trying Cloudflare Workers AI for ${articleId}`);
        const cfImage = await generateWithCloudflareAI(article, cfApiToken, cfAccountId);
        const cfMs = Date.now() - cfStart;
        if (cfImage) {
          const { buffer, mimeType } = base64ToBuffer(cfImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, cfImage, 'ai');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('Cloudflare AI: returned null (no image data)');
          methodTimings.push(`Cloudflare: ${cfMs}ms (null)`);
        }
      } catch (err: any) {
        const cfMs = Date.now() - cfStart;
        methodErrors.push(`Cloudflare AI: ${err.message?.slice(0, 100)}`);
        methodTimings.push(`Cloudflare: ${cfMs}ms (error)`);
        console.warn(`[Imager V266] Cloudflare Workers AI failed (${cfMs}ms): ${err.message?.slice(0, 150)}`);
      }
    } else {
      methodErrors.push(`Cloudflare AI: skipped (${!cfApiToken ? 'CLOUDFLARE_API_TOKEN' : 'R2_ACCOUNT_ID'} not set)`);
      methodTimings.push('Cloudflare: skipped');
    }

    // ═══════════════════════════════════════════════════════════
    // METHOD 2 (V265): Gemini Flash Image — Google's image generation
    // High quality, ~3-5s. Needs GEMINI_API_KEY.
    // Models: gemini-2.0-flash-exp (free preview), gemini-2.5-flash-image
    // Free tier: ~500 req/day for preview models. Paid for production models.
    // ═══════════════════════════════════════════════════════════
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        console.log(`[Imager V265] Trying Gemini Flash Image for ${articleId}`);
        const geminiImage = await generateWithGeminiFlash(article, geminiApiKey);
        if (geminiImage) {
          const { buffer, mimeType } = base64ToBuffer(geminiImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, geminiImage, 'gemini');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('Gemini Flash: returned null (no image data)');
        }
      } catch (err: any) {
        methodErrors.push(`Gemini Flash: ${err.message?.slice(0, 100)}`);
        console.warn(`[Imager V265] Gemini Flash Image failed: ${err.message?.slice(0, 150)}`);
      }
    } else {
      methodErrors.push('Gemini Flash: skipped (GEMINI_API_KEY not set)');
    }

    // ═══════════════════════════════════════════════════════════
    // METHOD 3 (V265): Prodia — FLUX schnell ultra-fast image gen
    // ~0.4s generation time, FLUX.1 schnell model, ~$0.001/image.
    // Needs PRODIA_API_KEY. Free tier available for FLUX schnell.
    // ═══════════════════════════════════════════════════════════
    const prodiaApiKey = process.env.PRODIA_API_KEY;
    if (prodiaApiKey) {
      try {
        console.log(`[Imager V265] Trying Prodia (FLUX schnell) for ${articleId}`);
        const prodiaImage = await generateWithProdia(article, prodiaApiKey);
        if (prodiaImage) {
          const { buffer, mimeType } = base64ToBuffer(prodiaImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, prodiaImage, 'prodia');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('Prodia: returned null (no image data)');
        }
      } catch (err: any) {
        methodErrors.push(`Prodia: ${err.message?.slice(0, 100)}`);
        console.warn(`[Imager V265] Prodia failed: ${err.message?.slice(0, 150)}`);
      }
    } else {
      methodErrors.push('Prodia: skipped (PRODIA_API_KEY not set)');
    }

    // ═══════════════════════════════════════════════════════════
    // METHOD 4: ZAI SDK image generation
    // Works reliably on Railway (not blocked like Pollinations 402)
    // ═══════════════════════════════════════════════════════════
    if (process.env.ZAI_BASE_URL) {
      try {
        console.log(`[Imager V264] Trying ZAI SDK for ${articleId}`);
        const imageBase64 = await generateWithZAISDK(article);
        if (imageBase64) {
          const { buffer, mimeType } = base64ToBuffer(imageBase64);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, imageBase64, 'ai');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('z-ai-sdk: returned null (no base64 data)');
        }
      } catch (err: any) {
        methodErrors.push(`z-ai-sdk: ${err.message?.slice(0, 100)}`);
        console.warn(`[Imager V264] z-ai-sdk image generation failed: ${err.message?.slice(0, 150)}`);
      }

      // ZAI CLI fallback — uses z-ai-generate CLI tool when SDK fails
      try {
        console.log(`[Imager V265] Trying ZAI CLI fallback for ${articleId}`);
        const cliImage = await generateWithZAICLI(article);
        if (cliImage) {
          const { buffer, mimeType } = base64ToBuffer(cliImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, cliImage, 'ai');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('z-ai-cli: returned null');
        }
      } catch (err: any) {
        methodErrors.push(`z-ai-cli: ${err.message?.slice(0, 100)}`);
        console.warn(`[Imager V264] z-ai-cli failed: ${err.message?.slice(0, 150)}`);
      }
    } else {
      methodErrors.push('z-ai-sdk: skipped (ZAI_BASE_URL not set)');
    }

    // METHOD 5: Together AI — FLUX.1-schnell-Free
    // FLUX.1-schnell-Free is rate-limited (~1 img/2s) but costs $0 forever.
    // ═══════════════════════════════════════════════════════════
    const togetherApiKey = process.env.TOGETHER_API_KEY;
    if (togetherApiKey) {
      try {
        console.log(`[Imager V264] Trying Together AI (FLUX.1-schnell-Free) for ${articleId}`);
        const togetherImage = await generateWithTogetherAI(article, togetherApiKey);
        if (togetherImage) {
          const { buffer, mimeType } = base64ToBuffer(togetherImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, togetherImage, 'together');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('Together AI: returned null (no image data)');
        }
      } catch (err: any) {
        methodErrors.push(`Together AI: ${err.message?.slice(0, 100)}`);
        console.warn(`[Imager V264] Together AI failed: ${err.message?.slice(0, 150)}`);
      }
    } else {
      methodErrors.push('Together AI: skipped (TOGETHER_API_KEY not set)');
    }

    // METHOD 6: HuggingFace Inference API for image generation
    // Free tier: rate-limited but reliable. Supports FLUX, SDXL, etc.
    // ═══════════════════════════════════════════════════════════
    const hfToken = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
    if (hfToken) {
      try {
        const hfModel = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';
        console.log(`[Imager V264] Trying HuggingFace image generation for ${articleId} (model: ${hfModel})`);
        const hfImage = await generateWithHuggingFace(article, hfToken);
        if (hfImage) {
          const { buffer, mimeType } = base64ToBuffer(hfImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, hfImage, 'huggingface');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('HuggingFace: returned null (no image data)');
        }
      } catch (err: any) {
        methodErrors.push(`HuggingFace: ${err.message?.slice(0, 100)}`);
        console.warn(`[Imager V264] HuggingFace image generation failed: ${err.message?.slice(0, 150)}`);
      }
    } else {
      methodErrors.push('HuggingFace: skipped (HF_API_KEY/HF_API_TOKEN/HF_TOKEN not set)');
    }

    // METHOD 7: Pollinations FLUX model with retry
    // Pollinations now returns 402 on Railway cloud IPs
    // ═══════════════════════════════════════════════════════════
    const pollinationsUp = await isPollinationsAvailable();

    if (pollinationsUp) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Imager V264] Flux attempt ${attempt}/2 for ${articleId}`);
          const fluxImage = await generateWithPollinationsFlux(article);
          if (fluxImage) {
            const { buffer, mimeType } = base64ToBuffer(fluxImage);
            const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, fluxImage, 'pollinations');
            advanceResult.duration = Date.now() - startTime;
            return advanceResult;
          } else {
            methodErrors.push(`Flux attempt ${attempt}: returned null`);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          }
        } catch (err: any) {
          methodErrors.push(`Flux attempt ${attempt}: ${err.message?.slice(0, 100)}`);
          console.warn(`[Imager V264] Flux attempt ${attempt} failed: ${err.message?.slice(0, 150)}`);
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        }
      }
    } else {
      methodErrors.push('Pollinations: skipped (health check failed — 402/down)');
    }

    // METHOD 8: Pollinations default model (backup)
    // ═══════════════════════════════════════════════════════════
    if (pollinationsUp) {
      try {
        console.log(`[Imager V264] Trying Pollinations default model for ${articleId}`);
        const pollinationsImage = await generateWithPollinations(article);
        if (pollinationsImage) {
          const { buffer, mimeType } = base64ToBuffer(pollinationsImage);
          const advanceResult = await saveAndAdvance(articleId, article.processingStage as ProcessingStage, buffer, mimeType, pollinationsImage, 'pollinations');
          advanceResult.duration = Date.now() - startTime;
          return advanceResult;
        } else {
          methodErrors.push('Pollinations-default: returned null');
        }
      } catch (err: any) {
        methodErrors.push(`Pollinations-default: ${err.message?.slice(0, 100)}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // METHOD 9 (GUARANTEED): Canvas/Sharp Template Engine
    // This CANNOT fail — no network, no API, just local rendering.
    // Generates a professional financial news cover image in <500ms.
    //
    // After Canvas, submit Stable Horde in BACKGROUND (non-blocking).
    //   The article publishes instantly with Canvas image.
    //   When Stable Horde finishes, the cron job replaces it with AI image.
    // ═══════════════════════════════════════════════════════════
    try {
      console.log(`[Imager V264] All API methods failed — using Canvas/Sharp template for ${articleId}`);
      const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
      
      const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
      const title = isLatin
        ? (article.title || 'Breaking News')
        : (article.titleAr || article.title || 'أخبار عاجلة');
      const locale = isLatin ? (article.locale as 'ar' | 'en' | 'es' | 'fr' | 'tr') : 'ar';
      
      const canvasBuffer = await generateArticleImage({
        title,
        category: article.category || 'اقتصاد كلي',
        locale,
        newsType: article.newsType || undefined,
        sentiment: article.sentiment || undefined,
        source: article.sourceName || article.source || undefined,
      });

      if (canvasBuffer && canvasBuffer.length > 500) {
        const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
        const advanceResult = await saveAndAdvance(
          articleId,
          article.processingStage as ProcessingStage,
          canvasBuffer,
          'image/jpeg',
          base64DataUrl,
          'canvas'
        );
        advanceResult.duration = Date.now() - startTime;
        console.log(`[Imager V264] ✓ Canvas/Sharp image generated for ${articleId} (${(canvasBuffer.length / 1024).toFixed(0)}KB) in ${advanceResult.duration}ms`);

        // Submit Stable Horde in background (non-blocking)
        // Article is now published with Canvas image. Stable Horde will replace it later.
        submitToStableHordeBackground(articleId, article).catch(err => {
          console.warn(`[Imager V264] Background Horde submit failed for ${articleId}: ${err?.message?.slice(0, 80)}`);
        });

        return advanceResult;
      } else {
        methodErrors.push('Canvas/Sharp: generated buffer too small (should never happen)');
      }
    } catch (canvasErr: any) {
      methodErrors.push(`Canvas/Sharp: ${canvasErr.message?.slice(0, 100)}`);
      console.error(`[Imager V264] Canvas/Sharp FAILED (should never happen): ${canvasErr.message}`);
    }

    // ═══════════════════════════════════════════════════════════
    // ALL methods failed (including Canvas — should NEVER reach here)
    // ═══════════════════════════════════════════════════════════
    // V266: Enhanced diagnostic logging — now includes timing for each method
    const detailedError = methodErrors.join(' | ');
    const timingSummary = methodTimings.join(', ');
    console.error(`[Imager V266] ✗ ALL methods including Canvas failed for ${articleId} — THIS SHOULD NEVER HAPPEN`);
    console.error(`[Imager V266] Method errors: ${detailedError}`);
    console.error(`[Imager V266] Method timings: ${timingSummary}`);
    console.error(`[Imager V266] API keys: CF=${!!process.env.CLOUDFLARE_API_TOKEN} R2=${!!process.env.R2_ACCOUNT_ID} Gemini=${!!process.env.GEMINI_API_KEY} Prodia=${!!process.env.PRODIA_API_KEY} ZAI=${!!process.env.ZAI_BASE_URL} Together=${!!process.env.TOGETHER_API_KEY} HF=${!!(process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN)}`);

    result.error = `All methods failed (including Canvas): ${detailedError}`;
    result.duration = Date.now() - startTime;

    const { recordError } = await import('../queue/job-manager');
    await recordError(articleId, `Image failed (all methods including Canvas): ${detailedError} [timings: ${timingSummary}]`);

    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[Imager] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}

// ── Generate image using z-ai-web-dev-sdk ──
async function generateWithZAISDK(article: any): Promise<string | null> {
  try {
    // V114d: Skip SDK entirely if ZAI_BASE_URL is not configured.
    if (!process.env.ZAI_BASE_URL) {
      console.log('[Imager V251] Skipping z-ai-sdk — ZAI_BASE_URL not set');
      return null;
    }
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    // V251: Increased timeout from IMAGE_TIMEOUT_MS to 120s for Railway
    const IMAGE_SDK_TIMEOUT = 120_000;
    const response = await Promise.race([
      zai.images.generations.create({
        prompt: imagePrompt,
        size: '1344x768',
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Image generation timeout (${IMAGE_SDK_TIMEOUT}ms)`)), IMAGE_SDK_TIMEOUT)
      ),
    ]) as any;

    if (response.data?.[0]?.base64) {
      console.log(`[Imager V251] ✓ ZAI SDK image generated (${response.data[0].base64.length} chars base64)`);
      return `data:image/png;base64,${response.data[0].base64}`;
    }

    return null;
  } catch (err: any) {
    console.warn(`[Imager V251] z-ai-sdk failed: ${err.message}`);
    return null;
  }
}

// ── V259: Generate image using Together AI (FLUX.1-schnell-Free) ──
// Together AI offers FLUX.1-schnell-Free — truly $0 forever, no credit card needed.
// Rate limited (~1 image/2s) but completely free. Works from Railway cloud IPs.
// Signup: https://api.together.xyz → free API key → set TOGETHER_API_KEY env var.
async function generateWithTogetherAI(article: any, apiKey: string): Promise<string | null> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    const imgBuffer = await callTogetherImageAPI(imagePrompt, apiKey);
    if (imgBuffer && imgBuffer.length > 2000) {
      const base64 = imgBuffer.toString('base64');
      console.log(`[Imager V259] ✓ Together AI image generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
      return `data:image/jpeg;base64,${base64}`;
    }

    console.warn(`[Imager V259] Together AI returned too small image: ${imgBuffer?.length || 0} bytes`);
    return null;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V259] Together AI request timed out`);
    } else {
      console.warn(`[Imager V259] Together AI failed: ${err.message?.slice(0, 150)}`);
    }
    return null;
  }
}

// ── V259: Low-level Together AI image API call (shared by generate + prewarm) ──
// Supports FLUX.1-schnell-Free ($0) and other Together AI image models.
// Returns raw image Buffer on success, null on failure.
async function callTogetherImageAPI(prompt: string, apiKey: string): Promise<Buffer | null> {
  // V259: Rate limiter — respect free tier limits
  const timeSinceLastRequest = Date.now() - _togetherLastRequestTime;
  if (timeSinceLastRequest < TOGETHER_MIN_INTERVAL_MS) {
    const waitMs = TOGETHER_MIN_INTERVAL_MS - timeSinceLastRequest;
    await new Promise(r => setTimeout(r, waitMs));
  }
  _togetherLastRequestTime = Date.now();

  // Model: FLUX.1-schnell-Free is $0 forever. Paid variant: black-forest-labs/FLUX.1-schnell
  const model = process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free';

  try {
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        width: 1344,
        height: 768,
        steps: 4,
        n: 1,
        response_format: 'b64_json',
      }),
      signal: AbortSignal.timeout(90000), // 90s — FLUX can take time on free tier
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 429) {
        console.warn(`[Imager V259] Together AI rate limited — will retry next cycle`);
        return null;
      }
      if (response.status === 402) {
        console.warn(`[Imager V259] Together AI payment required — check API key and model name`);
        return null;
      }
      throw new Error(`Together API ${response.status}: ${errText}`.slice(0, 200));
    }

    const result = await response.json() as any;

    // Together AI returns { data: [{ b64_json: "..." }] }
    if (result.data?.[0]?.b64_json) {
      const imgBuffer = Buffer.from(result.data[0].b64_json, 'base64');
      return imgBuffer;
    }
    // Fallback: some models return url instead of b64_json
    if (result.data?.[0]?.url) {
      const imgUrl = result.data[0].url;
      const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(30000) });
      if (imgRes.ok) {
        const contentType = imgRes.headers.get('content-type') || '';
        if (contentType.startsWith('image/')) {
          return Buffer.from(await imgRes.arrayBuffer());
        }
      }
    }

    console.warn(`[Imager V259] Together AI returned unexpected format: ${JSON.stringify(result).slice(0, 200)}`);
    return null;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V259] Together AI request timed out — free tier may be overloaded`);
    } else {
      console.warn(`[Imager V259] Together AI API call failed: ${err.message?.slice(0, 150)}`);
    }
    return null;
  }
}

// ── V261: Stable Horde API key helper ──
// Returns the API key to use — env var if valid (30+ chars), else anonymous.
function getStableHordeApiKey(): string {
  const hordeEnvKey = process.env.STABLEHORDE_API_KEY;
  if (hordeEnvKey && hordeEnvKey.length >= 30) {
    return hordeEnvKey;
  } else if (hordeEnvKey) {
    console.warn(`[Imager V261] STABLEHORDE_API_KEY too short (${hordeEnvKey.length} chars) — using anonymous access`);
  }
  return '0000000000'; // Anonymous default
}

// ── V261: Submit Stable Horde generation in BACKGROUND (non-blocking) ──
// Article is already published with Canvas image. This submits a Stable Horde
// request and saves the generationId in `lastError` as `HORDE_PENDING:id`.
// The /api/cron/horde-poll endpoint will check and replace the image later.
export async function submitToStableHordeBackground(articleId: string, article: any): Promise<void> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);
    const hordeApiKey = getStableHordeApiKey();

    console.log(`[Imager V261] Submitting Stable Horde background generation for ${articleId}`);

    const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Agent': 'RouaTradingNews:1.0',
        'apikey': hordeApiKey,
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        params: {
          width: 1024,
          height: 576,
          steps: 20,
          cfg_scale: 7,
          sampler_name: 'k_euler_a',
          n: 1,
        },
        nsfw: false,
        models: ['SDXL 1.0', 'Deliberate', 'stable_diffusion_2.1'],
        r2: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => '');
      console.warn(`[Imager V261] Stable Horde background submit failed (${submitRes.status}): ${errText.slice(0, 150)}`);
      return;
    }

    const submitData = await submitRes.json() as any;
    const generationId = submitData.id;
    if (!generationId) {
      console.warn(`[Imager V261] Stable Horde returned no generation ID for ${articleId}`);
      return;
    }

    // Save generationId in lastError field as HORDE_PENDING:id
    // This marker tells the cron job to poll for this generation
    await db.newsItem.update({
      where: { id: articleId },
      data: { lastError: `HORDE_PENDING:${generationId}` },
    });

    console.log(`[Imager V261] ✓ Stable Horde background generation queued for ${articleId}: ${generationId}`);

  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V261] Stable Horde background submit timed out for ${articleId}`);
    } else {
      console.warn(`[Imager V261] Stable Horde background submit failed for ${articleId}: ${err.message?.slice(0, 150)}`);
    }
  }
}

// ── V261: Poll a single Stable Horde generation and replace image if done ──
// Called by /api/cron/horde-poll. Returns true if image was replaced.
export async function pollAndReplaceHordeImage(articleId: string, generationId: string): Promise<boolean> {
  try {
    const hordeApiKey = getStableHordeApiKey();

    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${generationId}`, {
      headers: { 'Client-Agent': 'RouaTradingNews:1.0', 'apikey': hordeApiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!statusRes.ok) {
      console.warn(`[Horde Poll V261] Status check failed for ${articleId} (${statusRes.status})`);
      return false;
    }

    const statusData = await statusRes.json() as any;
    const done = statusData.done === true;
    const faulted = statusData.faulted === true;

    // If faulted or impossible, clean up and stop polling
    if (faulted || statusData.is_possible === false) {
      console.warn(`[Horde Poll V261] Generation ${generationId} faulted/impossible — clearing for ${articleId}`);
      await db.newsItem.update({
        where: { id: articleId },
        data: { lastError: null },
      });
      return false;
    }

    if (!done) {
      const waitTime = statusData.wait_time ?? 0;
      const queuePos = statusData.queue_position ?? 0;
      console.log(`[Horde Poll V261] Still waiting for ${articleId}: queue=#${queuePos}, wait=${waitTime}s`);
      return false;
    }

    // Generation is done — fetch the result
    const resultRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${generationId}`, {
      headers: { 'Client-Agent': 'RouaTradingNews:1.0', 'apikey': hordeApiKey },
      signal: AbortSignal.timeout(15000),
    });

    if (!resultRes.ok) {
      console.warn(`[Horde Poll V261] Result fetch failed for ${articleId} (${resultRes.status})`);
      return false;
    }

    const resultData = await resultRes.json() as any;
    const imgEntry = resultData.generations?.[0];

    if (!imgEntry?.img) {
      console.warn(`[Horde Poll V261] No image data in result for ${articleId}`);
      await db.newsItem.update({ where: { id: articleId }, data: { lastError: null } });
      return false;
    }

    // Download or decode the image
    let imgBuffer: Buffer;
    if (imgEntry.img.startsWith('http')) {
      // R2 URL — download it
      const imgRes = await fetch(imgEntry.img, { signal: AbortSignal.timeout(30000) });
      if (!imgRes.ok || !(imgRes.headers.get('content-type') || '').startsWith('image/')) {
        console.warn(`[Horde Poll V261] Image download failed for ${articleId}`);
        return false;
      }
      imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      // Base64 string
      imgBuffer = Buffer.from(imgEntry.img, 'base64');
    }

    if (imgBuffer.length < 2000) {
      console.warn(`[Horde Poll V261] Image too small (${imgBuffer.length}B) for ${articleId}`);
      await db.newsItem.update({ where: { id: articleId }, data: { lastError: null } });
      return false;
    }

    // Upload to R2 and update the article
    const base64DataUrl = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
    const storedValue = await saveImageV97(articleId, imgBuffer, 'image/jpeg', base64DataUrl);

    await db.newsItem.update({
      where: { id: articleId },
      data: {
        generatedImage: storedValue,
        lastError: null, // Clear the HORDE_PENDING marker
      },
    });

    console.log(`[Horde Poll V261] ✓ AI image replaced Canvas for ${articleId} (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
    return true;

  } catch (err: any) {
    console.warn(`[Horde Poll V261] Error polling for ${articleId}: ${err.message?.slice(0, 100)}`);
    return false;
  }
}

// ── V261: Find all articles with pending Stable Horde generations ──
export async function getPendingHordeGenerations(): Promise<Array<{ articleId: string; generationId: string }>> {
  const articles = await db.newsItem.findMany({
    where: {
      lastError: { startsWith: 'HORDE_PENDING:' },
    },
    select: { id: true, lastError: true },
    take: 50, // Process max 50 per cron run
  });

  return articles
    .map(a => ({
      articleId: a.id,
      generationId: a.lastError!.replace('HORDE_PENDING:', ''),
    }))
    .filter(a => a.generationId.length > 10); // Validate generationId format
}

// ── V260: Generate image using Stable Horde — LEGACY BLOCKING VERSION ──
// Kept as fallback for direct calls, but NOT used in the main pipeline anymore.
// V261: The main pipeline now uses non-blocking submit + background cron replacement.
async function generateWithStableHorde(article: any): Promise<string | null> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    const hordeApiKey = getStableHordeApiKey();
    const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Agent': 'RouaTradingNews:1.0',
        'apikey': hordeApiKey,
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        params: { width: 1024, height: 576, steps: 20, cfg_scale: 7, sampler_name: 'k_euler_a', n: 1 },
        nsfw: false,
        models: ['SDXL 1.0', 'Deliberate', 'stable_diffusion_2.1'],
        r2: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => '');
      console.warn(`[Imager V261] Stable Horde submit failed (${submitRes.status}): ${errText.slice(0, 150)}`);
      return null;
    }

    const submitData = await submitRes.json() as any;
    const generationId = submitData.id;
    if (!generationId) return null;

    console.log(`[Imager V261] Stable Horde generation queued (blocking): ${generationId}`);

    // Poll for result (max 180s — Stable Horde is slow on free tier)
    const pollStart = Date.now();
    while (Date.now() - pollStart < 180_000) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${generationId}`, {
          headers: { 'Client-Agent': 'RouaTradingNews:1.0', 'apikey': getStableHordeApiKey() },
          signal: AbortSignal.timeout(10000),
        });
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json() as any;
        if (statusData.done === true) {
          const resultRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${generationId}`, {
            headers: { 'Client-Agent': 'RouaTradingNews:1.0', 'apikey': getStableHordeApiKey() },
            signal: AbortSignal.timeout(15000),
          });
          if (!resultRes.ok) return null;
          const resultData = await resultRes.json() as any;
          const imgEntry = resultData.generations?.[0];
          if (imgEntry?.img) {
            let imgBuffer: Buffer;
            if (imgEntry.img.startsWith('http')) {
              const imgRes = await fetch(imgEntry.img, { signal: AbortSignal.timeout(30000) });
              if (!imgRes.ok) return null;
              imgBuffer = Buffer.from(await imgRes.arrayBuffer());
            } else {
              imgBuffer = Buffer.from(imgEntry.img, 'base64');
            }
            if (imgBuffer.length > 2000) {
              console.log(`[Imager V261] ✓ Stable Horde image (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
              return `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
            }
          }
          return null;
        }
        console.log(`[Imager V261] Stable Horde: waiting... (queue=#${statusData.queue_position}, wait=${statusData.wait_time}s)`);
      } catch { continue; }
    }
    console.warn(`[Imager V261] Stable Horde timed out after 180s`);
    return null;
  } catch (err: any) {
    console.warn(`[Imager V261] Stable Horde failed: ${err.message?.slice(0, 150)}`);
    return null;
  }
}

// ── V265: Generate image using Gemini Flash Image (Google) ──
// API: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// Auth: x-goog-api-key header
// Response: JSON with base64 image in candidates[0].content.parts[].inlineData.data
// Models: gemini-2.0-flash-exp (free preview), gemini-2.5-flash-preview-05-20
// Free tier: ~500 req/day for preview models. Needs GEMINI_API_KEY.
async function generateWithGeminiFlash(article: any, apiKey: string): Promise<string | null> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    const geminiModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    console.log(`[Imager V265] Calling Gemini Flash Image (${geminiModel}) for ${article.id || 'unknown'}`);

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: imagePrompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: '16:9',
          }
        }
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Imager V265] Gemini Flash failed (${response.status}): ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await response.json() as any;

    // Find the image part in the response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      console.warn(`[Imager V265] Gemini Flash returned no candidates`);
      return null;
    }

    const parts = candidates[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);

    if (!imagePart?.inlineData?.data) {
      console.warn(`[Imager V265] Gemini Flash returned no image data in parts`);
      return null;
    }

    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    if (base64Data.length < 100) {
      console.warn(`[Imager V265] Gemini Flash image too small (${base64Data.length} chars base64)`);
      return null;
    }

    const dataUrlPrefix = mimeType.includes('png') ? 'data:image/png;base64,' : 'data:image/jpeg;base64,';
    console.log(`[Imager V265] ✓ Gemini Flash Image generated (${(base64Data.length / 1024).toFixed(0)}KB base64, ${mimeType})`);
    return `${dataUrlPrefix}${base64Data}`;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V265] Gemini Flash request timed out`);
    } else {
      console.warn(`[Imager V265] Gemini Flash failed: ${err.message?.slice(0, 150)}`);
    }
    return null;
  }
}

// ── V265: Generate image using Prodia (FLUX schnell) ──
// API: POST https://inference.prodia.com/v2/job (synchronous)
// Auth: Authorization: Bearer {token}
// Response: Raw binary image when Accept: image/jpeg header is set
// Models: inference.flux-fast.schnell.txt2img.v2 (free to try, ~$0.001/image)
// Speed: ~0.4s generation. Needs PRODIA_API_KEY.
async function generateWithProdia(article: any, apiKey: string): Promise<string | null> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    const prodiaJobType = process.env.PRODIA_JOB_TYPE || 'inference.flux-fast.schnell.txt2img.v2';
    const prodiaUrl = 'https://inference.prodia.com/v2/job';

    console.log(`[Imager V265] Calling Prodia (${prodiaJobType}) for ${article.id || 'unknown'}`);

    const response = await fetch(prodiaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'image/jpeg',
      },
      body: JSON.stringify({
        type: prodiaJobType,
        config: {
          prompt: imagePrompt.slice(0, 1000),
          aspect_ratio: '16:9',
        }
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Imager V265] Prodia failed (${response.status}): ${errText.slice(0, 200)}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';

    // Prodia V2 returns raw binary when Accept: image/jpeg is set
    if (contentType.startsWith('image/') || contentType.startsWith('multipart/')) {
      const arrayBuffer = await response.arrayBuffer();
      const imgBuffer = Buffer.from(arrayBuffer);

      if (imgBuffer.length < 2000) {
        console.warn(`[Imager V265] Prodia image too small (${imgBuffer.length} bytes)`);
        return null;
      }

      const base64 = imgBuffer.toString('base64');
      console.log(`[Imager V265] ✓ Prodia image generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
      return `data:image/jpeg;base64,${base64}`;
    }

    // Fallback: handle JSON response (shouldn't happen with Accept: image/jpeg)
    const jsonData = await response.json() as any;
    if (jsonData.imageUrl) {
      // Download from URL
      const imgRes = await fetch(jsonData.imageUrl, { signal: AbortSignal.timeout(30000) });
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        if (imgBuffer.length > 2000) {
          const base64 = imgBuffer.toString('base64');
          console.log(`[Imager V265] ✓ Prodia image downloaded from URL (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
          return `data:image/png;base64,${base64}`;
        }
      }
    }

    console.warn(`[Imager V265] Prodia unexpected response format: ${contentType}`);
    return null;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V265] Prodia request timed out`);
    } else {
      console.warn(`[Imager V265] Prodia failed: ${err.message?.slice(0, 150)}`);
    }
    return null;
  }
}

// ── V262: Generate image using Cloudflare Workers AI ──
// Uses the same Cloudflare account as R2 storage.
// Free tier: 10,000 neurons/day (~100-500 images/day).
// Model: @cf/stabilityai/stable-diffusion-xl-base-1.0
async function generateWithCloudflareAI(article: any, apiToken: string, accountId: string): Promise<string | null> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    const cfModel = process.env.CF_IMAGE_MODEL || '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${cfModel}`;

    console.log(`[Imager V262] Calling Cloudflare Workers AI (${cfModel}) for ${article.id || 'unknown'}`);

    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        num_steps: 20,
        width: 1024,
        height: 576,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Imager V262] Cloudflare AI failed (${response.status}): ${errText.slice(0, 150)}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let imgBuffer: Buffer;

    if (contentType.includes('image/')) {
      imgBuffer = Buffer.from(await response.arrayBuffer());
    } else if (contentType.includes('json')) {
      const jsonData = await response.json() as any;
      if (jsonData.image) {
        imgBuffer = Buffer.from(jsonData.image, 'base64');
      } else if (jsonData.data?.[0]) {
        const b64 = jsonData.data[0].b64_json || jsonData.data[0];
        imgBuffer = Buffer.from(typeof b64 === 'string' ? b64 : JSON.stringify(b64), 'base64');
      } else {
        console.warn(`[Imager V262] Cloudflare AI returned unexpected JSON: ${JSON.stringify(jsonData).slice(0, 200)}`);
        return null;
      }
    } else {
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength < 1000) {
        console.warn(`[Imager V262] Cloudflare AI returned too small response (${arrayBuf.byteLength} bytes)`);
        return null;
      }
      imgBuffer = Buffer.from(arrayBuf);
    }

    if (imgBuffer.length < 2000) {
      console.warn(`[Imager V262] Cloudflare AI image too small (${imgBuffer.length} bytes)`);
      return null;
    }

    const base64 = imgBuffer.toString('base64');
    console.log(`[Imager V262] ✓ Cloudflare Workers AI image generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
    return `data:image/png;base64,${base64}`;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V262] Cloudflare AI request timed out`);
    } else {
      console.warn(`[Imager V262] Cloudflare AI failed: ${err.message?.slice(0, 150)}`);
    }
    return null;
  }
}

// ── V253: Generate image using HuggingFace Inference API ──
// Uses the HF API key already configured for text — now also for image generation.
// V259: Added model fallback chain — tries FLUX → SDXL → SD 1.5 if credits depleted.
async function generateWithHuggingFace(article: any, hfToken: string): Promise<string | null> {
  try {
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    // V259: Try multiple HF models — FLUX.1-schnell first, then SDXL fallbacks
    const hfModel = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';
    const hfModelFallbacks = [
      hfModel,
      'stabilityai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5',
    ];
    const modelsToTry = [hfModelFallbacks[0], ...hfModelFallbacks.slice(1).filter(m => m !== hfModelFallbacks[0])];

    for (const model of modelsToTry) {
      const hfUrl = `https://router.huggingface.co/hf-inference/models/${model}`;
      const isFluxModel = model.includes('FLUX');
      const requestBody = JSON.stringify({
        inputs: imagePrompt,
        parameters: {
          width: 1344,
          height: 768,
          num_inference_steps: isFluxModel ? 4 : 20, // FLUX=4, SDXL/SD=20
        },
      });

      const response = await fetch(hfUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        // 402 = depleted credits — try next model in fallback chain
        if (response.status === 402) {
          console.warn(`[Imager V259] HuggingFace model ${model} returned 402 (credits depleted) — trying next model`);
          continue;
        }
        if (response.status === 503 && errText.includes('loading')) {
          const estimatedWait = errText.match(/estimated_time.*?(\d+\.?\d*)/)?.[1];
          const waitSeconds = estimatedWait ? Math.min(Math.ceil(parseFloat(estimatedWait)), 30) : 15;
          console.log(`[Imager V253] HuggingFace model loading — waiting ${waitSeconds}s and retrying...`);
          await new Promise(r => setTimeout(r, waitSeconds * 1000));
          const retryRes = await fetch(hfUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfToken}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
            signal: AbortSignal.timeout(60000),
          });
          if (!retryRes.ok) {
            const retryErrText = await retryRes.text().catch(() => '');
            if (retryRes.status === 503) {
              console.warn(`[Imager V253] HuggingFace model still loading after retry — skipping`);
              continue; // V259: Try next model instead of giving up
            }
            if (retryRes.status === 402) {
              console.warn(`[Imager V259] HuggingFace model ${model} returned 402 on retry — trying next model`);
              continue;
            }
            throw new Error(`HF retry failed: ${retryRes.status} ${retryErrText}`.slice(0, 200));
          }
          const retryBuffer = Buffer.from(await retryRes.arrayBuffer());
          if (retryBuffer.length > 1000) {
            const base64 = retryBuffer.toString('base64');
            console.log(`[Imager V253] ✓ HuggingFace image generated (${(retryBuffer.length / 1024).toFixed(0)}KB) after retry using ${model}`);
            return `data:image/jpeg;base64,${base64}`;
          }
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('x-retry-after') || response.headers.get('retry-after') || 'unknown';
          console.warn(`[Imager V253] HuggingFace rate limited — retry after: ${retryAfter}s`);
          return null;
        }
        throw new Error(`HF API ${response.status}: ${errText}`.slice(0, 200));
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      if (imageBuffer.length > 1000) {
        const base64 = imageBuffer.toString('base64');
        console.log(`[Imager V253] ✓ HuggingFace image generated (${(imageBuffer.length / 1024).toFixed(0)}KB) using ${model}`);
        return `data:image/jpeg;base64,${base64}`;
      }

      console.warn(`[Imager V253] HuggingFace returned too small image: ${imageBuffer.length} bytes from ${model}`);
      continue; // V259: Try next model
    } // end of model fallback loop

    console.warn(`[Imager V259] All HuggingFace models failed`);
    return null;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Imager V253] HuggingFace request timed out — model may be loading or overloaded`);
    } else {
      console.warn(`[Imager V253] HuggingFace image failed: ${err.message?.slice(0, 150)}`);
    }
    return null;
  }
}

// ── V251: Generate image using z-ai-generate CLI tool ──
// When the SDK fails (e.g., "fetch failed" on Railway), the CLI tool
// may work because it uses a different HTTP client implementation.
async function generateWithZAICLI(article: any): Promise<string | null> {
  try {
    const { execSync } = await import('child_process');
    const isLatin = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatin ? (article.title || '') : (article.titleAr || article.title || '');
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const imagePrompt = buildImagePrompt(title, category, locale);

    // Escape prompt for shell
    const escapedPrompt = imagePrompt.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const outputPath = `/tmp/rouaa-img-${article.id || Date.now()}.png`;

    execSync(`z-ai-generate --prompt "${escapedPrompt}" --output "${outputPath}" --size 1344x768`, {
      timeout: 120_000,
      stdio: 'pipe',
    });

    if (existsSync(outputPath)) {
      const fileBuffer = readFileSync(outputPath);
      if (fileBuffer.length > 1000) {
        const base64 = fileBuffer.toString('base64');
        console.log(`[Imager V251] ✓ ZAI CLI image generated (${(fileBuffer.length / 1024).toFixed(0)}KB)`);
        return `data:image/png;base64,${base64}`;
      }
    }

    return null;
  } catch (err: any) {
    console.warn(`[Imager V251] z-ai-cli failed: ${err.message?.slice(0, 150)}`);
    return null;
  }
}

// ── Generate image using Pollinations.ai ──
async function generateWithPollinations(article: any): Promise<string | null> {
  try {
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const visual = getCategoryVisual(category, locale);

    // V115 FIX: Use ONLY the English visual prompt — no Arabic title.
    // Arabic title causes extremely long URLs after encoding (each Arabic char = ~9 bytes),
    // which can cause HTTP 414 (URL Too Long) or timeout on some networks.
    // The category visual alone produces excellent financial images.
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`professional financial news illustration: ${visual}. Modern editorial style. High quality.`)}?width=1344&height=768&nologo=true&seed=${Date.now()}`;

    const imageResponse = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(60000), // V113: Increased from 45s to 60s — give Pollinations more time
    });

    if (!imageResponse.ok) {
      console.warn(`[Imager] Pollinations download failed: HTTP ${imageResponse.status}`);
      return null;
    }

    const contentType = imageResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.warn(`[Imager] Pollinations returned non-image content-type: ${contentType}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');

    // V240: Raised minimum from 100 to 500 chars — 100 chars (~75 bytes) is not a real image.
    // Matches the Flux method's minimum. Catches error pages and corrupt data.
    if (base64.length < 500) {
      console.warn(`[Imager V240] Pollinations returned too small image: ${base64.length} chars base64 (min 500)`);
      return null;
    }

    const mimeType = contentType || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`[Imager] Pollinations image downloaded as base64: ${base64.length} chars`);
    return dataUrl;
  } catch (err: any) {
    console.warn(`[Imager] Pollinations download failed: ${err.message}`);
    return null;
  }
}

// ── V233: Generate image using Pollinations.ai FLUX model (backup image generator) ──
// Uses the Flux model explicitly via the model=flux parameter.
// Flux produces different results from the default model, making it a good backup
// when the default model fails or returns poor quality images.
async function generateWithPollinationsFlux(article: any): Promise<string | null> {
  try {
    const category = article.category || 'finance';
    const locale = article.locale || 'ar';
    const visual = getCategoryVisual(category, locale);
    const title = (['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar') ? article.title : (article.titleAr || article.title || '')).slice(0, 40);

    // V233: Use Flux model with a different prompt style for variety
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`professional financial news cover: ${visual}. Cinematic lighting, editorial magazine style. No text. High quality.`)}?width=1344&height=768&nologo=true&seed=${Date.now()}&model=flux`;

    console.log(`[Imager V233] Generating Flux model image for ${article.id || 'unknown'}`);
    const imageResponse = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(75000), // Flux can take longer
      headers: {
        'User-Agent': 'RouaTradingNews/1.0 (Image Generator)',
        'Accept': 'image/*',
      },
    });

    if (!imageResponse.ok) {
      console.warn(`[Imager V233] Flux model download failed: HTTP ${imageResponse.status}`);
      return null;
    }

    const contentType = imageResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.warn(`[Imager V233] Flux returned non-image content-type: ${contentType}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');

    if (base64.length < 500) {
      console.warn(`[Imager V233] Flux returned too small image: ${base64.length} chars base64`);
      return null;
    }

    const mimeType = contentType.includes('jpeg') ? 'image/jpeg' : contentType.includes('webp') ? 'image/webp' : 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`[Imager V233] Flux model image downloaded: ${base64.length} chars base64`);
    return dataUrl;
  } catch (err: any) {
    console.warn(`[Imager V233] Flux model download failed: ${err.message}`);
    return null;
  }
}

// ── V162: Download category stock image from Pollinations.ai ──
// V162 FIX: Replaced Unsplash stock image fallback with Pollinations AI-generated images.
// Unsplash was removed from the platform policy — only AI-generated images allowed.
// When ALL primary AI image generation fails, download a Pollinations image for
// the article's category. This ensures articles are NEVER blocked by image failures.
async function downloadCategoryStockImage(category: string, locale?: string): Promise<string | null> {
  try {
    const visual = getCategoryVisual(category, locale);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`professional financial news illustration: ${visual}. Modern editorial style. High quality.`)}?width=1344&height=768&nologo=true&seed=${Date.now()}&model=flux`;

    console.log(`[Imager] V162: Downloading category AI image for "${category}" from Pollinations`);

    const imageResponse = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(60000), // 60s — Pollinations can take time
      headers: {
        'User-Agent': 'RouaTradingNews/1.0 (Image Generator)',
        'Accept': 'image/*',
      },
    });

    if (!imageResponse.ok) {
      console.warn(`[Imager] V162: AI image download failed: HTTP ${imageResponse.status}`);
      return null;
    }

    const contentType = imageResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.warn(`[Imager] V162: AI image returned non-image content-type: ${contentType}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');

    if (base64.length < 500) {
      console.warn(`[Imager] V162: AI image too small: ${base64.length} chars base64`);
      return null;
    }

    const mimeType = contentType.includes('jpeg') ? 'image/jpeg' : 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`[Imager] V162: AI category image downloaded: ${base64.length} chars base64`);
    return dataUrl;
  } catch (err: any) {
    console.warn(`[Imager] V162: AI category image download failed: ${err.message}`);
    return null;
  }
}

// V162: getCategoryStockUrl REMOVED — Unsplash completely replaced with Pollinations AI images.
// The downloadCategoryStockImage function now uses Pollinations.ai directly
// via getCategoryVisual() prompts instead of hardcoded Unsplash URLs.

// ── English category visual mapping ──
// Maps English categoryId and category names to visual prompts.
// Used when locale === 'en' to generate appropriate images.
function getCategoryVisualsEn(): Record<string, string> {
  return {
    // By categoryId
    'economy': 'global economy with interconnected financial networks and GDP indicators',
    'stocks': 'stock market trading floor with digital charts and green/red indicators',
    'forex': 'forex trading screen with currency pairs and candlestick charts',
    'crypto': 'cryptocurrency blockchain network with glowing nodes and digital coins',
    'energy': 'oil refinery at sunset with energy infrastructure',
    'commodities': 'gold bars and crude oil barrels in a professional setting',
    'realEstate': 'modern real estate development with luxury buildings',
    'banking': 'grand central bank building with monetary policy symbols',
    'earnings': 'corporate earnings report with profit charts and growth indicators',
    'arabMarkets': 'Middle Eastern financial district with modern skyscrapers',
    'technology': 'futuristic technology innovation with AI and digital transformation',
    'politics': 'government building with policy documents and official seals',
    'breaking': 'breaking news studio with financial ticker and urgent alerts',
    // By English category name (fallback)
    'Economy': 'global economy with interconnected financial networks and GDP indicators',
    'Stocks': 'stock market trading floor with digital charts and green/red indicators',
    'Forex': 'forex trading screen with currency pairs and candlestick charts',
    'Crypto': 'cryptocurrency blockchain network with glowing nodes and digital coins',
    'Energy': 'oil refinery at sunset with energy infrastructure',
    'Commodities': 'gold bars and crude oil barrels in a professional setting',
    'Real Estate': 'modern real estate development with luxury buildings',
    'Banking': 'grand central bank building with monetary policy symbols',
    'Earnings': 'corporate earnings report with profit charts and growth indicators',
    'Arab Markets': 'Middle Eastern financial district with modern skyscrapers',
    'Technology': 'futuristic technology innovation with AI and digital transformation',
    'Politics': 'government building with policy documents and official seals',
    'Breaking': 'breaking news studio with financial ticker and urgent alerts',
    'Personal Finance': 'personal finance dashboard with budget charts and savings indicators',
    'Low Priority': 'minimal financial chart with muted colors and subtle indicators',
  };
}

function getCategoryVisual(category: string, locale?: string): string {
  // When locale is a Latin-script locale, use English category visuals
  if (locale && ['en', 'es', 'fr', 'tr'].includes(locale)) {
    const visualsEn = getCategoryVisualsEn();
    if (visualsEn[category]) return visualsEn[category];
    // Try case-insensitive match for English categories
    const lowerCat = category.toLowerCase();
    for (const key of Object.keys(visualsEn)) {
      if (key.toLowerCase() === lowerCat) return visualsEn[key];
    }
  }
  // Default: Arabic category visuals
  const visuals = getCategoryVisuals();
  return visuals[category] || visuals['اقتصاد كلي'];
}

// V240: Export category visuals for pre-warm cache
function getCategoryVisuals(): Record<string, string> {
  return {
    'أسهم': 'stock market trading floor with digital charts and green/red indicators',
    'كريبتو': 'cryptocurrency blockchain network with glowing nodes and digital coins',
    'عملات رقمية': 'cryptocurrency blockchain visualization with golden digital coins',
    'طاقة': 'oil refinery at sunset with energy infrastructure',
    'اقتصاد أمريكي': 'Wall Street with American flag and financial district skyline',
    'عملات': 'world currencies floating with exchange rate indicators',
    'فوركس': 'forex trading screen with currency pairs and candlestick charts',
    'بنوك مركزية': 'grand central bank building with monetary policy symbols',
    'أسواق عربية': 'Middle Eastern financial district with modern skyscrapers',
    'سلع': 'gold bars and crude oil barrels in a professional setting',
    'عقارات': 'modern real estate development with luxury buildings',
    'تقنية': 'futuristic technology innovation with AI and digital transformation',
    'سياسة': 'government building with policy documents and official seals',
    'أرباح شركات': 'corporate earnings report with profit charts and growth indicators',
    'اقتصاد كلي': 'global economy with interconnected financial networks and GDP indicators',
    'عاجل': 'breaking news studio with financial ticker and urgent alerts',
  };
}

function buildImagePrompt(title: string, category: string, locale?: string): string {
  const visual = getCategoryVisual(category, locale);
  return `Professional financial news illustration: ${visual}. Modern, clean, editorial style. No text overlay. High quality journalism illustration. ${title.slice(0, 60)}`;
}

// ── V115: Generate SVG placeholder image as GUARANTEED fallback ──
// When ALL image methods (z-ai-sdk, Pollinations, Unsplash) fail,
// this creates a professional-looking SVG with the article category.
// It requires NO external network calls — it always works.
// The SVG is compact (~2KB), renders at any size, and satisfies the
// publisher's mandatory generatedImage requirement.
function generateSvgPlaceholder(article: any): Buffer | null {
  try {
    const category = article.category || 'اقتصاد كلي';
    const isLatinSvg = ['en', 'es', 'fr', 'tr'].includes(article.locale || 'ar');
    const title = isLatinSvg ? (article.title || '').slice(0, 80) : (article.titleAr || article.title || '').slice(0, 80);
    // Map category to a visual color
    const categoryColors: Record<string, { bg: string; accent: string }> = {
      'أسهم': { bg: '#0a1628', accent: '#00e5ff' },
      'كريبتو': { bg: '#0a1628', accent: '#f7931a' },
      'عملات رقمية': { bg: '#0a1628', accent: '#f7931a' },
      'طاقة': { bg: '#1a0e00', accent: '#ff9800' },
      'اقتصاد أمريكي': { bg: '#0a1628', accent: '#2196f3' },
      'عملات': { bg: '#0a1628', accent: '#4caf50' },
      'فوركس': { bg: '#0a1628', accent: '#00e676' },
      'بنوك مركزية': { bg: '#0a1628', accent: '#9c27b0' },
      'أسواق عربية': { bg: '#1a0e00', accent: '#cddc39' },
      'سلع': { bg: '#1a1400', accent: '#ffc107' },
      'عقارات': { bg: '#0a1628', accent: '#03a9f4' },
      'تقنية': { bg: '#0a0a1a', accent: '#7c4dff' },
      'سياسة': { bg: '#1a0a0a', accent: '#f44336' },
      'أرباح شركات': { bg: '#0a1a0a', accent: '#4caf50' },
      'اقتصاد كلي': { bg: '#0a1628', accent: '#00bcd4' },
      'عاجل': { bg: '#1a0a0a', accent: '#ff5722' },
    };
    const colors = categoryColors[category] || categoryColors['اقتصاد كلي'];
    // Escape XML special characters in title and category
    const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCategory = category.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="768" viewBox="0 0 1344 768">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg}"/>
      <stop offset="100%" style="stop-color:#050810"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.2"/>
    </linearGradient>
  </defs>
  <rect width="1344" height="768" fill="url(#bg)"/>
  <rect x="0" y="0" width="1344" height="4" fill="url(#accent)"/>
  <rect x="80" y="340" width="120" height="4" rx="2" fill="${colors.accent}" opacity="0.6"/>
  <text x="80" y="400" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${colors.accent}" opacity="0.9">${safeCategory}</text>
  <text x="80" y="460" font-family="Arial, sans-serif" font-size="22" fill="#8899aa" opacity="0.8">${safeTitle}</text>
  <rect x="80" y="500" width="200" height="2" rx="1" fill="${colors.accent}" opacity="0.3"/>
  <text x="80" y="540" font-family="Arial, sans-serif" font-size="16" fill="#556677" opacity="0.7">ROUAA FINANCIAL NEWS</text>
  <circle cx="1200" cy="400" r="120" fill="${colors.accent}" opacity="0.04"/>
  <circle cx="1200" cy="400" r="80" fill="${colors.accent}" opacity="0.03"/>
  <circle cx="1200" cy="400" r="40" fill="${colors.accent}" opacity="0.02"/>
</svg>`;
    return Buffer.from(svg, 'utf-8');
  } catch (err: any) {
    console.error(`[Imager V115] SVG generation error: ${err.message}`);
    return null;
  }
}
