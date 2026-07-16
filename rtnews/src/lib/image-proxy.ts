// ─── Image URL Proxy Helper ─────────────────────────────────
// V125: Pollinations URLs returned DIRECTLY (no proxy) — fixes 502 errors
// The proxy caused double-latency and 502 Bad Gateway when Pollinations
// was slow or returned errors. Pollinations has its own CDN that handles
// caching and retries. Direct URLs load faster and more reliably.
// The /api/image-proxy endpoint is still available for admin/server-side operations.

/**
 * Get the best URL for displaying an image.
 * V125: Returns Pollinations URLs DIRECTLY instead of routing through proxy.
 * This eliminates 502 errors and reduces latency by avoiding double-hop.
 *
 * @param url - The original image URL
 * @param fallbackQuery - Search query for Pollinations fallback (replaces Unsplash)
 * @returns The direct URL, enhanced Pollinations URL, or the original URL
 */
export function getProxiedImageUrl(url: string | undefined | null, fallbackQuery?: string): string | null {
  if (!url) return null;

  // Base64 data URLs — return as-is (stored in DB, always available)
  if (url.startsWith('data:')) return url;

  // Local/generated images — return as-is (no proxy needed)
  if (url.startsWith('/generated/') || url.startsWith('/article-images/') || url.startsWith('/api/infographic-image')) {
    return url;
  }

  // R2 CDN URLs — return as-is (persistent, no proxy needed)
  if (url.includes('.r2.dev/') || url.includes('.r2.cloudflarestorage.com/')) return url;
  const r2PublicUrl = (typeof process !== 'undefined' && process.env.R2_PUBLIC_URL) || '';
  if (r2PublicUrl && url.startsWith(r2PublicUrl.replace(/\/$/, '') + '/')) return url;

  try {
    const parsed = new URL(url);

    // V125: Unsplash images replaced with Pollinations AI-generated images (DIRECT)
    if (parsed.hostname === 'images.unsplash.com' || parsed.hostname.includes('unsplash.com')) {
      const prompt = fallbackQuery || 'professional financial trading chart dark background';
      const pollinationsUrl = getEnhancedImageUrl(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      );
      // Return DIRECT Pollinations URL — no proxy (V125 fix)
      return pollinationsUrl;
    }

    // V125: Return Pollinations URLs DIRECTLY — no proxy
    // The proxy caused 502 errors and double-latency.
    // Pollinations CDN handles caching and is reliable for direct browser access.
    // Client-side retry logic in SlideWithImage handles any failures.
    if (parsed.hostname === 'image.pollinations.ai') {
      const enhancedUrl = getEnhancedImageUrl(url);
      return enhancedUrl;
    }

    // For other domains, return the original URL
    return url;
  } catch {
    // If URL parsing fails but it looks like a local path, return it
    if (url.startsWith('/')) return url;
    return null;
  }
}

/**
 * Strip Unsplash tracking parameters from a URL.
 * This removes ixid and ixlib params that can trigger 503 errors.
 */
export function stripUnsplashTracking(url: string): string {
  if (!url || !url.includes('unsplash.com')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'images.unsplash.com') return url;

    // Keep only essential params
    const photoId = parsed.pathname.replace('/', '');
    const width = parsed.searchParams.get('w') || '1080';
    const quality = parsed.searchParams.get('q') || '80';
    return `https://images.unsplash.com/${photoId}?w=${width}&q=${quality}`;
  } catch {
    return url;
  }
}

/**
 * Generate an enhanced Pollinations.ai image URL with retry support.
 * Adds nologo=true, proper dimensions, and a random seed for retry attempts.
 * Uses shorter prompts to avoid URL length issues.
 *
 * @param url - The original Pollinations URL
 * @param retryCount - Retry attempt number (0 = first try, 1 = first retry, etc.)
 * @param width - Desired image width (default 1080)
 * @param height - Desired image height (default 720)
 * @returns Enhanced Pollinations URL
 */
export function getEnhancedImageUrl(
  url: string,
  retryCount: number = 0,
  width: number = 1080,
  height: number = 720
): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);

    // Only enhance Pollinations URLs
    if (parsed.hostname !== 'image.pollinations.ai') return url;

    // Extract the prompt from the path (strip the /prompt/ prefix)
    const promptText = parsed.pathname.replace(/^\/prompt\//, '').replace(/^\//, '');
    let prompt = decodeURIComponent(promptText);

    // Truncate very long prompts to avoid URL length issues (max ~2000 chars URL)
    if (prompt.length > 300) {
      prompt = prompt.substring(0, 297) + '...';
    }

    // Build enhanced URL with parameters
    const params = new URLSearchParams();
    params.set('nologo', 'true');
    params.set('width', String(width));
    params.set('height', String(height));
    // Use different seed for each retry to get different images
    const seed = retryCount > 0 ? `retry${retryCount}${Date.now() % 10000}` : 'default';
    params.set('seed', seed);
    params.set('model', 'flux');

    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
  } catch {
    return url;
  }
}

/**
 * Check if a URL is a Pollinations.ai URL.
 * Pollinations images need special handling because they generate on-the-fly
 * and can take 5-30 seconds to load.
 */
export function isPollinationsUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === 'image.pollinations.ai';
  } catch {
    return false;
  }
}
