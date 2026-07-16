// @ts-nocheck
// ─── Image Proxy Route V125 ─────────────────────────────────
// GET /api/image-proxy?url=... — Proxies Pollinations.ai images through our domain
// V125: Retry with different seed on failure + redirect fallback instead of 502
// V124: Added R2 caching — images are saved to R2 after first fetch
// NOTE: Client-side now uses direct Pollinations URLs (V125 image-proxy.ts).
// This endpoint is kept for admin/server-side operations and backward compat.

import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToR2, isR2Available, isR2Url } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';

// In-memory cache for current server instance (24h TTL)
const IMAGE_CACHE = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Generate an R2 key from a Pollinations URL for cache lookup
function getR2KeyForUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'image.pollinations.ai') return null;
    const promptPart = parsed.pathname.replace(/^\/prompt\//, '');
    const seed = parsed.searchParams.get('seed') || 'default';
    const width = parsed.searchParams.get('width') || '1080';
    const hash = Buffer.from(`${promptPart}-${seed}-${width}`).toString('base64url').slice(0, 60);
    return `proxied-images/${hash}.jpg`;
  } catch {
    return null;
  }
}

// Build a retry URL with a different seed
function buildRetryUrl(originalUrl: string, attempt: number): string {
  try {
    const parsed = new URL(originalUrl);
    if (parsed.hostname !== 'image.pollinations.ai') return originalUrl;
    parsed.searchParams.set('seed', `retry${attempt}${Date.now() % 10000}`);
    return parsed.toString();
  } catch {
    return originalUrl;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  // Only allow Pollinations.ai images
  const allowedHosts = ['image.pollinations.ai'];
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith('.' + host))) {
    return NextResponse.json({ error: 'Domain not allowed — only AI-generated images' }, { status: 403 });
  }

  // Step 1: Check in-memory cache (fastest)
  const cacheKey = parsedUrl.origin + parsedUrl.pathname + parsedUrl.search;
  const cached = IMAGE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.data, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT-MEMORY',
      },
    });
  }

  // Step 2: Check if we have this image on R2 (persistent CDN cache)
  const r2Key = getR2KeyForUrl(url);
  if (r2Key && isR2Available()) {
    const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
    if (r2PublicUrl) {
      const r2Url = `${r2PublicUrl}/${r2Key}`;
      try {
        const headResp = await fetch(r2Url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        if (headResp.ok) {
          return NextResponse.redirect(r2Url, 307);
        }
      } catch {
        // R2 check failed, continue to fetch from Pollinations
      }
    }
  }

  // Step 3: Fetch from Pollinations with retry logic
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const fetchUrl = attempt === 0 ? url : buildRetryUrl(url, attempt);

    try {
      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'RouaTradingNews/1.0 (Image Proxy)',
          'Accept': 'image/*',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout (was 60s — too long)
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        console.warn(`[ImageProxy] Upstream ${response.status} (attempt ${attempt + 1}) for: ${fetchUrl.slice(0, 100)}`);
        if (attempt < MAX_RETRIES) continue; // Retry with different seed
        // V125: Instead of returning 502, redirect to the original URL
        // The browser can try loading it directly from Pollinations CDN
        console.warn(`[ImageProxy] All retries failed, redirecting to direct URL`);
        return NextResponse.redirect(url, 307);
      }

      const data = Buffer.from(await response.arrayBuffer());

      // Validate that we got actual image data (not empty or error page)
      if (data.length < 5000) {
        console.warn(`[ImageProxy] Image too small (${data.length} bytes, attempt ${attempt + 1}): ${fetchUrl.slice(0, 80)}`);
        if (attempt < MAX_RETRIES) continue; // Retry
        // V125: Redirect to direct URL instead of 502
        return NextResponse.redirect(url, 307);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Cache in memory
      IMAGE_CACHE.set(cacheKey, { data, contentType, timestamp: Date.now() });

      // Cache in R2 for persistence (fire and forget)
      if (r2Key && isR2Available()) {
        uploadImageToR2(r2Key, data, contentType).then(result => {
          if (result.success) {
            console.log(`[ImageProxy] Cached to R2: ${r2Key} (${data.length} bytes)`);
          }
        }).catch(() => { /* silent */ });
      }

      // Clean up old cache entries (prevent memory leaks)
      if (IMAGE_CACHE.size > 200) {
        const now = Date.now();
        for (const [key, value] of IMAGE_CACHE) {
          if (now - value.timestamp > CACHE_TTL) IMAGE_CACHE.delete(key);
        }
      }

      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': attempt === 0 ? 'MISS' : `MISS-RETRY${attempt}`,
        },
      });
    } catch (err: any) {
      console.warn(`[ImageProxy] Fetch error (attempt ${attempt + 1}): ${err.message?.slice(0, 80)}`);
      if (attempt < MAX_RETRIES) continue;
      // V125: Last attempt failed — redirect to direct URL instead of 500
      console.warn(`[ImageProxy] All attempts failed, redirecting to direct URL`);
      return NextResponse.redirect(url, 307);
    }
  }

  // Should never reach here, but just in case
  return NextResponse.redirect(url, 307);
}
