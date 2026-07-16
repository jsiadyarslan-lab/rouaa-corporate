// ─── Article Image API Route — Egress-Optimized ─────────────
// CRITICAL: This route is the #1 source of Supabase egress.
// Every image request was hitting the DB and transferring the
// full base64 image (500KB-2MB each). With 10 images per page
// and thousands of page views + bots, this consumed 151GB of
// the 5GB free tier in one month.
//
// Fix: Server-side in-memory cache + filesystem cache.
//   - First request: Reads from DB, caches in memory + filesystem
//   - Subsequent requests: Served from cache, NO DB hit, NO egress
//   - R2 URLs: Redirected directly (CDN, no egress at all)
//   - Base64 images: Decoded once, cached as file, never re-read from DB
//
// Expected egress reduction: 95%+ (from ~5GB/day to ~250MB/day)

import { NextResponse } from 'next/server';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { isR2Url } from '@/lib/image-storage';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── In-memory cache (survives within same process) ──
// Key: articleId, Value: { url (for redirect) | buffer + contentType (for serve) }
const imageCache = new Map<string, {
  type: 'redirect' | 'serve';
  url?: string;
  buffer?: Buffer;
  contentType?: string;
  cachedAt: number;
}>();
const CACHE_MAX_SIZE = 500; // Max cached images in memory
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL

// ── Filesystem cache directory ──
function getCacheDir(): string {
  return join(process.cwd(), 'public', 'article-images');
}

function ensureCacheDir(): void {
  const dir = getCacheDir();
  if (!existsSync(dir)) {
    try { mkdirSync(dir, { recursive: true }); } catch {}
  }
}

// ── Get cached image from filesystem ──
function getFileCache(articleId: string): { buffer: Buffer; contentType: string } | null {
  const dir = getCacheDir();
  for (const ext of ['png', 'jpg', 'webp', 'svg']) {
    const filePath = join(dir, `${articleId}.${ext}`);
    if (existsSync(filePath)) {
      try {
        const buffer = readFileSync(filePath);
        const contentType = ext === 'jpg' ? 'image/jpeg'
          : ext === 'webp' ? 'image/webp'
          : ext === 'svg' ? 'image/svg+xml'
          : 'image/png';
        return { buffer, contentType };
      } catch { return null; }
    }
  }
  return null;
}

// ── Save image to filesystem cache ──
function saveFileCache(articleId: string, buffer: Buffer, ext: string): void {
  try {
    ensureCacheDir();
    const filePath = join(getCacheDir(), `${articleId}.${ext}`);
    writeFileSync(filePath, buffer);
  } catch (err: any) {
    console.warn(`[ArticleImage] File cache write failed for ${articleId}: ${err.message}`);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return new NextResponse('Not found', { status: 404 });
  }

  // ── Step 1: Check in-memory cache (fastest, zero DB/egress) ──
  const memCached = imageCache.get(id);
  if (memCached && Date.now() - memCached.cachedAt < CACHE_TTL_MS) {
    if (memCached.type === 'redirect' && memCached.url) {
      return NextResponse.redirect(memCached.url);
    }
    if (memCached.type === 'serve' && memCached.buffer && memCached.contentType) {
      return new NextResponse(memCached.buffer as any, { // Cast: Argument of type 'Buffer<ArrayBufferLike>' is not
        status: 200,
        headers: {
          'Content-Type': memCached.contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Content-Length': memCached.buffer.length.toString(),
        },
      });
    }
  }

  // ── Step 2: Check filesystem cache (fast, no DB hit) ──
  const fileCached = getFileCache(id);
  if (fileCached) {
    // Also cache in memory for next time
    if (imageCache.size < CACHE_MAX_SIZE) {
      imageCache.set(id, {
        type: 'serve',
        buffer: fileCached.buffer,
        contentType: fileCached.contentType,
        cachedAt: Date.now(),
      });
    }
    return new NextResponse(fileCached.buffer as any, { // Cast: Argument of type 'Buffer<ArrayBufferLike>' is not
      status: 200,
      headers: {
        'Content-Type': fileCached.contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Length': fileCached.buffer.length.toString(),
      },
    });
  }

  // ── Step 3: Fetch from DB (only on first request or cache miss) ──
  // V1219e: Support ALL content types — not just NewsItem
  // Tries: newsItem → economicReport → marketAnalysis → geopoliticalRisk
  let article: any = null;
  let contentTypeKind: 'news' | 'strategic_report' | 'market_analysis' | 'geopolitical_risk' = 'news';
  let fallbackPrompt = '';
  try {
    // Try NewsItem first (most common)
    article = await Promise.race([
      db.newsItem.findUnique({
        where: { id },
        select: { generatedImage: true, imageUrl: true, title: true, titleAr: true, category: true },
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('DB query timeout (5s)')), 5000)
      ),
    ]);
    if (article) {
      fallbackPrompt = (article.titleAr || article.title || '') + ' ' + (article.category || 'financial news');
    }

    // If not NewsItem, try EconomicReport (strategic reports)
    if (!article) {
      try {
        article = await db.economicReport.findUnique({
          where: { id },
          select: { imageUrl: true, title: true, summary: true, reportType: true, scope: true },
        });
        if (article) {
          contentTypeKind = 'strategic_report';
          fallbackPrompt = 'strategic financial report ' + (article.title || '') + ' ' + (article.summary || '').slice(0, 100);
        }
      } catch {}
    }

    // If not found, try MarketAnalysis (technical analyses)
    if (!article) {
      try {
        article = await db.marketAnalysis.findUnique({
          where: { id },
          select: { imageUrl: true, title: true, assetClass: true, analysisType: true },
        });
        if (article) {
          contentTypeKind = 'market_analysis';
          fallbackPrompt = 'technical analysis ' + (article.assetClass || '') + ' ' + (article.title || '');
        }
      } catch {}
    }

    // If not found, try GeopoliticalRisk
    if (!article) {
      try {
        article = await db.geopoliticalRisk.findUnique({
          where: { id },
          select: { imageUrl: true, title: true, summary: true, riskCategory: true, riskLevel: true },
        });
        if (article) {
          contentTypeKind = 'geopolitical_risk';
          fallbackPrompt = 'geopolitical risk analysis ' + (article.riskCategory || '') + ' ' + (article.title || '');
        }
      } catch {}
    }
  } catch (selectErr: any) {
    if (selectErr.message?.includes('timeout')) {
      return new NextResponse('Timeout', { status: 504 });
    }
    return new NextResponse('Not found', { status: 404 });
  }

  if (!article) {
    return new NextResponse('Not found', { status: 404 });
  }

  // V1219e: For non-NewsItem types, generatedImage field doesn't exist — use imageUrl
  const generatedImage = article.generatedImage || article.imageUrl;

  // ── Handle R2 URLs (redirect — zero egress, CDN-backed) ──
  if (generatedImage && isR2Url(generatedImage)) {
    if (imageCache.size < CACHE_MAX_SIZE) {
      imageCache.set(id, {
        type: 'redirect',
        url: generatedImage,
        cachedAt: Date.now(),
      });
    }
    return NextResponse.redirect(generatedImage);
  }

  // ── Handle filesystem path URLs ──
  if (generatedImage && generatedImage.startsWith('/article-images/')) {
    const filePath = join(process.cwd(), 'public', generatedImage);
    if (existsSync(filePath)) {
      try {
        const fileBuffer = readFileSync(filePath);
        const ext = generatedImage.split('.').pop()?.toLowerCase() || 'png';
        const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
          : ext === 'webp' ? 'image/webp'
          : 'image/png';

        // Cache in memory
        if (imageCache.size < CACHE_MAX_SIZE) {
          imageCache.set(id, {
            type: 'serve',
            buffer: fileBuffer,
            contentType,
            cachedAt: Date.now(),
          });
        }

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      } catch {}
    }
  }

  // ── Handle external URLs (redirect) ──
  if (generatedImage && (generatedImage.startsWith('http://') || generatedImage.startsWith('https://'))) {
    if (imageCache.size < CACHE_MAX_SIZE) {
      imageCache.set(id, {
        type: 'redirect',
        url: generatedImage,
        cachedAt: Date.now(),
      });
    }
    return NextResponse.redirect(generatedImage);
  }

  // ── Handle base64-encoded images (the main egress problem!) ──
  // Decode once, save to filesystem cache, cache in memory, then serve.
  // Next request will hit filesystem cache — NO DB query, NO egress.
  if (generatedImage) {
    // SVG placeholder
    if (generatedImage.includes('data:image/svg+xml')) {
      const base64Content = generatedImage.includes('base64,') ? generatedImage.split('base64,')[1] : generatedImage;
      try {
        const buffer = Buffer.from(base64Content, 'base64');
        // Save to filesystem cache
        saveFileCache(id, buffer, 'svg');
        // Cache in memory
        if (imageCache.size < CACHE_MAX_SIZE) {
          imageCache.set(id, { type: 'serve', buffer, contentType: 'image/svg+xml', cachedAt: Date.now() });
        }
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch {}
    }

    // Regular base64 image
    const base64Content = generatedImage.includes('base64,') ? generatedImage.split('base64,')[1] : generatedImage;

    if (base64Content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(base64Content.slice(0, 100))) {
      try {
        const buffer = Buffer.from(base64Content, 'base64');
        let contentType = 'image/png';
        let ext = 'png';
        if (generatedImage.includes('data:image/jpeg')) { contentType = 'image/jpeg'; ext = 'jpg'; }
        else if (generatedImage.includes('data:image/webp')) { contentType = 'image/webp'; ext = 'webp'; }

        // ── KEY OPTIMIZATION: Save decoded image to filesystem cache ──
        // This means future requests will NEVER need to read base64 from DB again.
        // Reduces egress by 95%+ because the DB is no longer transferring base64 on every request.
        saveFileCache(id, buffer, ext);

        // Cache in memory
        if (imageCache.size < CACHE_MAX_SIZE) {
          imageCache.set(id, { type: 'serve', buffer, contentType, cachedAt: Date.now() });
        }

        // ── BACKGROUND: Migrate base64 to R2 if configured ──
        // Don't await — this runs in the background to gradually eliminate base64 from DB.
        migrateBase64ToR2(id, buffer, contentType).catch(() => {});

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch {}
    }
  }

  // V1219g: Fallback — generate image via Pollinations, upload to R2, persist URL in DB
  // This ensures reports, analyses, and geopolitical risks always have an image
  // WITHOUT bloating the DB (only the R2 URL string is stored, not the image bytes)
  if (fallbackPrompt && fallbackPrompt.length > 10) {
    try {
      // Build a descriptive prompt for Pollinations
      const prompt = `${fallbackPrompt.slice(0, 250)}, professional financial journalism, dark background, cinematic lighting, no text`;
      const seed = id.charCodeAt(0) || 42;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1344&height=768&nologo=true&seed=${seed}`;

      // V1219g: Try to fetch the image from Pollinations and upload to R2 (background)
      // This persists the image so future requests don't hit Pollinations again.
      // We do this in the background and return a redirect immediately for fast response.
      migratePollinationsToR2(id, pollinationsUrl, contentTypeKind).catch(() => {});

      // Cache the redirect URL (survives 30 min in memory)
      if (imageCache.size < CACHE_MAX_SIZE) {
        imageCache.set(id, {
          type: 'redirect',
          url: pollinationsUrl,
          cachedAt: Date.now(),
        });
      }

      return NextResponse.redirect(pollinationsUrl);
    } catch (pollErr: any) {
      console.warn(`[ArticleImage V1219g] Pollinations fallback failed for ${id}: ${pollErr.message?.slice(0, 80)}`);
    }
  }

  return new NextResponse('Not found', { status: 404 });
}

// ── V1219g: Background migration: Pollinations URL → R2 + DB update ──
// Fetches the image from Pollinations, uploads to R2, and updates the DB
// with the R2 URL. Future requests will serve directly from R2 (zero egress).
// Only stores the URL string in DB (not the image bytes) — no DB bloat.
async function migratePollinationsToR2(
  articleId: string,
  pollinationsUrl: string,
  contentTypeKind: 'news' | 'strategic_report' | 'market_analysis' | 'geopolitical_risk'
): Promise<void> {
  try {
    const { uploadImageToR2, isR2Available } = await import('@/lib/image-storage');
    if (!isR2Available()) {
      // R2 not configured — keep using Pollinations URL (no persistence)
      return;
    }

    // Fetch the image from Pollinations (with timeout)
    const resp = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(30000),
      headers: { 'Accept': 'image/png, image/jpeg' },
    });
    if (!resp.ok) {
      console.warn(`[ArticleImage V1219g] Pollinations fetch failed: ${resp.status}`);
      return;
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.length < 2000) {
      console.warn(`[ArticleImage V1219g] Pollinations returned tiny image (${buffer.length} bytes)`);
      return;
    }

    // Upload to R2
    const mimeType = 'image/png';
    const r2Result = await uploadImageToR2(`article-${articleId}`, buffer, mimeType);
    if (!r2Result.success || !r2Result.url) {
      console.warn(`[ArticleImage V1219g] R2 upload failed: ${r2Result.error}`);
      return;
    }

    console.log(`[ArticleImage V1219g] ✓ Uploaded to R2 for ${articleId} (${contentTypeKind}): ${r2Result.url.slice(0, 80)}...`);

    // Update DB with R2 URL — only the URL string, not the image bytes
    // This prevents future requests from hitting Pollinations again
    try {
      if (contentTypeKind === 'strategic_report') {
        await db.economicReport.update({ where: { id: articleId }, data: { imageUrl: r2Result.url } });
      } else if (contentTypeKind === 'market_analysis') {
        await db.marketAnalysis.update({ where: { id: articleId }, data: { imageUrl: r2Result.url } });
      } else if (contentTypeKind === 'geopolitical_risk') {
        await db.geopoliticalRisk.update({ where: { id: articleId }, data: { imageUrl: r2Result.url } });
      }
      // Note: newsItem already has its own migration path (migrateBase64ToR2)
    } catch (dbErr: any) {
      console.warn(`[ArticleImage V1219g] DB update failed for ${articleId}: ${dbErr.message?.slice(0, 80)}`);
    }

    // Update in-memory cache to use R2 URL for subsequent requests
    if (imageCache.size < CACHE_MAX_SIZE) {
      imageCache.set(articleId, {
        type: 'redirect',
        url: r2Result.url,
        cachedAt: Date.now(),
      });
    }
  } catch (err: any) {
    if (!err.message?.includes('R2 not configured')) {
      console.warn(`[ArticleImage V1219g] Migration failed for ${articleId}: ${err.message?.slice(0, 80)}`);
    }
  }
}

// ── Background migration: base64 → R2 ──
// When we encounter a base64 image, upload it to R2 in the background
// and update the DB with the R2 URL. This gradually eliminates ALL
// base64 images from the database, reducing egress permanently.
async function migrateBase64ToR2(articleId: string, buffer: Buffer, mimeType: string): Promise<void> {
  try {
    const { uploadImageToR2 } = await import('@/lib/image-storage');
    const result = await uploadImageToR2(articleId, buffer, mimeType);
    if (result.success) {
      // Update DB: replace base64 with R2 URL
      await db.newsItem.update({
        where: { id: articleId },
        data: { generatedImage: result.url },
      });
      console.log(`[ArticleImage] ✓ Migrated base64 → R2 for ${articleId} (saved ~${(buffer.length / 1024).toFixed(0)}KB of egress per request)`);

      // Update memory cache to use redirect
      imageCache.set(articleId, {
        type: 'redirect',
        url: result.url,
        cachedAt: Date.now(),
      });
    }
  } catch (err: any) {
    // Non-critical — will retry on next request
    if (!err.message?.includes('R2 not configured')) {
      console.warn(`[ArticleImage] R2 migration failed for ${articleId}: ${err.message?.slice(0, 80)}`);
    }
  }
}
