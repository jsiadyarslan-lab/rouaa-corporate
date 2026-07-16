// ─── NewsImage — Unified Image Component with Golden Rule Compliance ──
// Every news image MUST display properly. No broken icons, no flickering,
// no "coming and going". If the image fails, show a beautiful category
// gradient placeholder — never show a broken image icon.
//
// V162 FIX: 6 critical bugs fixed:
//   1. Added `key` prop on <img> — forces React re-mount when src changes,
//      preventing stale image rendering and incorrect load/error events
//   2. Added Pollinations proxy routing via getProxiedImageUrl() — server-side
//      caching, avoids direct browser→Pollinations failures
//   3. Added retry mechanism for Pollinations images (up to 2 retries with
//      different seeds) — matches SlideWithImage/HeroSlide behavior
//   4. Capped global Sets (failedUrls/loadedUrls) at 500 entries to prevent
//      unbounded memory growth over time
//   5. Added stale callback protection — when src changes, old onLoad/onError
//      callbacks are ignored via stale ref check
//   6. Added Unsplash URL detection and automatic replacement with Pollinations
//      AI-generated images — any legacy Unsplash data now shows AI images
//
// V1035 FIX (Spanish/English news images invisible): SSR race condition.
//   When the server renders <img src="...">, the browser starts loading the
//   image immediately. By the time React hydrates and attaches the onLoad
//   handler, the image may already be complete (especially for /api/article-image
//   responses that are cached by the browser). In that case onLoad never fires,
//   `loaded` state stays false, and opacity stays at 0 — image is invisible.
//   Fix: added imgRef + post-hydration check that calls handleLoad() if the
//   underlying <img> is already complete with a valid naturalWidth.

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getProxiedImageUrl, getEnhancedImageUrl, isPollinationsUrl as checkIsPollinations } from '@/lib/image-proxy';

// ─── Category color mapping for gradient fallbacks ─────────
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  forex: ['#0d9488', '#0f766e'],
  metals: ['#d97706', '#b45309'],
  crypto: ['#8b5cf6', '#7c3aed'],
  oil: ['#dc2626', '#b91c1c'],
  stocks: ['#059669', '#047857'],
  'arab-markets': ['#0891b2', '#0e7490'],
  'central-banks': ['#6366f1', '#4f46e5'],
  earnings: ['#16a34a', '#15803d'],
  macro: ['#0ea5e9', '#0284c7'],
  fed: ['#e11d48', '#be123c'],
  economy: ['#059669', '#047857'],
  // Arabic category names
  '\u0627\u0642\u062A\u0635\u0627\u062F \u0643\u0644\u064A': ['#059669', '#047857'],
  '\u0641\u0648\u0631\u0643\u0633': ['#0d9488', '#0f766e'],
  '\u0645\u0639\u0627\u062F\u0646': ['#d97706', '#b45309'],
  '\u0639\u0645\u0644\u0627\u062A \u0631\u0642\u0645\u064A\u0629': ['#8b5cf6', '#7c3aed'],
  '\u0646\u0641\u0637': ['#dc2626', '#b91c1c'],
  '\u0623\u0633\u0647\u0645': ['#059669', '#047857'],
  '\u0623\u0633\u0648\u0627\u0642 \u0639\u0631\u0628\u064A\u0629': ['#0891b2', '#0e7490'],
};

function getCategoryGradient(category: string): [string, string] {
  return CATEGORY_GRADIENTS[category] || ['#475569', '#334155'];
}

// ─── Global cache with size limits (V162 FIX #4) ──────────
const MAX_CACHE_SIZE = 500;

// Global cache of failed image URLs to prevent re-attempts across re-renders
const failedUrls = new Set<string>();

// Global cache of successfully loaded image URLs.
// When a carousel slide re-appears, if its image was already loaded
// by the browser, it shows instantly without any flicker or re-fetch.
const loadedUrls = new Set<string>();

// Evict oldest entries when cache exceeds limit
function addToCache(set: Set<string>, url: string) {
  if (set.size >= MAX_CACHE_SIZE) {
    // Delete the first (oldest) entry
    const firstEntry = set.values().next().value;
    if (firstEntry) set.delete(firstEntry);
  }
  set.add(url);
}

// ─── Category → Pollinations prompt mapping (V162 FIX #6) ──
const CATEGORY_POLLINATIONS_PROMPTS: Record<string, string> = {
  forex: 'currency exchange forex trading',
  metals: 'gold bars precious metals',
  crypto: 'cryptocurrency bitcoin digital',
  oil: 'oil refinery petroleum energy',
  stocks: 'stock market trading floor',
  'arab-markets': 'middle east financial district',
  'central-banks': 'central bank building monetary',
  earnings: 'corporate earnings profit chart',
  macro: 'global economy GDP indicators',
  fed: 'federal reserve building interest rates',
  economy: 'economic growth indicators',
};

function getPollinationsFallbackQuery(category: string): string {
  return CATEGORY_POLLINATIONS_PROMPTS[category] || 'professional financial news dark background';
}

// ─── Check if URL is an Unsplash URL (V162 FIX #6) ────────
function isUnsplashUrl(url: string): boolean {
  return url.includes('unsplash.com') || url.includes('source.unsplash.com');
}

// ─── Process source URL: proxy + Unsplash replacement (V162 FIX #2 & #6) ──
function processImageUrl(
  rawSrc: string | null | undefined,
  category: string,
  retryCount: number = 0
): string | null {
  if (!rawSrc || rawSrc.length === 0) return null;

  // V231: API image proxy routes — return as-is (no further processing needed)
  if (rawSrc.startsWith('/api/article-image/') || rawSrc.startsWith('/api/infographic-image')) {
    return rawSrc;
  }

  // V162 FIX #6: Replace Unsplash URLs with Pollinations AI-generated images
  if (isUnsplashUrl(rawSrc)) {
    const query = getPollinationsFallbackQuery(category);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query + ', professional business photography, dark cinematic')}?width=1080&height=720&nologo=true&seed=${retryCount || 42}&model=flux`;
    // Route through proxy for caching
    return getProxiedImageUrl(pollinationsUrl, query) || pollinationsUrl;
  }

  // V162 FIX #2: Route Pollinations URLs through our image proxy for caching
  if (retryCount > 0 && checkIsPollinations(rawSrc)) {
    const enhancedUrl = getEnhancedImageUrl(rawSrc, retryCount);
    return getProxiedImageUrl(enhancedUrl, undefined) || enhancedUrl;
  }

  // Route all external URLs through proxy
  const proxied = getProxiedImageUrl(rawSrc, getPollinationsFallbackQuery(category));
  return proxied || rawSrc;
}

// V120: Preload an image URL into the browser cache.
// Used by carousel to fetch next/previous slide images before they're shown.
// Returns a promise that resolves when the image is loaded (or rejects on error).
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (loadedUrls.has(url)) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      addToCache(loadedUrls, url);
      resolve();
    };
    img.onerror = () => {
      addToCache(failedUrls, url);
      reject(new Error(`Failed to preload: ${url.slice(0, 80)}`));
    };
    img.src = url;
  });
}

// V120: Check if an image URL has been loaded before (for instant display)
export function isImageLoaded(url: string): boolean {
  return loadedUrls.has(url);
}

// ─── Retry configuration (V162 FIX #3) ───────────────────
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

interface NewsImageProps {
  src?: string | null;
  alt?: string;
  category?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;           // For absolute-positioned background images
  overlayOpacity?: number;  // For hero/slider background (0-1)
  loading?: 'lazy' | 'eager'; // Image loading strategy (default: 'eager' to avoid Edge placeholder intervention)
}

export default function NewsImage({
  src,
  alt = '',
  category = '',
  width,
  height,
  className = '',
  style = {},
  fill = false,
  overlayOpacity,
  loading = 'eager',
}: NewsImageProps) {
  // V158: Proper initial state — check global caches on first render
  const validSrc = src && src.length > 0 ? src : null;

  // V162 FIX #5: Stale callback protection — track current src identity
  // When src changes, old onLoad/onError callbacks are ignored
  const srcIdentityRef = useRef<string>(validSrc || '');
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // V1035 FIX: Ref to the underlying <img> element so we can inspect its
  // post-hydration loading state and recover from the SSR race condition.
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Process the image URL (proxy routing + Unsplash replacement)
  const [processedUrl, setProcessedUrl] = useState<string | null>(() =>
    processImageUrl(validSrc, category)
  );

  const isSrcFailed = validSrc ? failedUrls.has(validSrc) : true;
  const isSrcLoaded = validSrc ? loadedUrls.has(validSrc) : false;

  const [error, setError] = useState(isSrcFailed);
  const [loaded, setLoaded] = useState(isSrcLoaded);
  const [retryCount, setRetryCount] = useState(0);

  // When src changes, reset everything and update identity ref
  useEffect(() => {
    // Clear any pending retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Update identity ref for stale callback protection
    srcIdentityRef.current = validSrc || '';
    retryRef.current = 0;

    if (validSrc && !failedUrls.has(validSrc)) {
      setError(false);
      setLoaded(loadedUrls.has(validSrc));
      setRetryCount(0);
      // V162 FIX #2: Process URL through proxy
      setProcessedUrl(processImageUrl(validSrc, category));
    } else {
      setError(!validSrc ? true : failedUrls.has(validSrc));
      setLoaded(false);
      setRetryCount(0);
      setProcessedUrl(processImageUrl(validSrc, category));
    }

    // Cleanup on unmount or src change
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [validSrc, category]);

  // V1035 FIX: Post-hydration recovery for the SSR race condition.
  // If the <img> is already complete (browser finished loading it before
  // React hydrated), onLoad never fires and `loaded` stays false — image
  // stays at opacity:0 forever. This effect runs after mount AND whenever
  // processedUrl changes, inspects the actual <img> element, and recovers.
  useEffect(() => {
    if (!processedUrl) return;
    // Defer to next tick so the ref is attached and the browser has had a
    // chance to mark the image as complete.
    const raf = requestAnimationFrame(() => {
      const img = imgRef.current;
      if (!img) return;
      // Image already loaded by browser before hydration — recover.
      if (img.complete && img.naturalWidth > 0 && !loaded) {
        if (srcIdentityRef.current === validSrc) {
          if (validSrc) addToCache(loadedUrls, validSrc);
          setLoaded(true);
          setError(false);
        }
      }
      // Image already failed before hydration — recover to fallback.
      if (img.complete && img.naturalWidth === 0 && !error) {
        if (validSrc) addToCache(failedUrls, validSrc);
        setError(true);
        setLoaded(false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [processedUrl, validSrc, loaded, error]);

  // V162 FIX #3: Handle image error with retry for Pollinations images
  const handleError = useCallback(() => {
    // V162 FIX #5: Ignore stale callbacks from previous src
    const currentIdentity = validSrc;
    if (srcIdentityRef.current !== currentIdentity) return;

    // Retry logic for Pollinations images
    const isPollinations = validSrc ? checkIsPollinations(validSrc) : false;
    if (isPollinations && retryRef.current < MAX_RETRIES) {
      retryRef.current += 1;
      const nextRetry = retryRef.current;
      setRetryCount(nextRetry);

      // Generate a new URL with different seed for retry
      const retryUrl = processImageUrl(validSrc, category, nextRetry);
      console.log(`[NewsImage] Retrying image (attempt ${nextRetry}/${MAX_RETRIES}): ${retryUrl?.slice(0, 80)}`);

      retryTimerRef.current = setTimeout(() => {
        // Only retry if we're still on the same src
        if (srcIdentityRef.current === currentIdentity) {
          setProcessedUrl(retryUrl);
          setError(false);
          setLoaded(false);
        }
      }, RETRY_DELAY_MS * nextRetry);
    } else {
      // Final failure — add to failed cache and show fallback
      if (validSrc) addToCache(failedUrls, validSrc);
      setError(true);
    }
  }, [validSrc, category]);

  const handleLoad = useCallback(() => {
    // V162 FIX #5: Ignore stale callbacks from previous src
    if (srcIdentityRef.current !== validSrc) return;

    if (validSrc) addToCache(loadedUrls, validSrc);
    setLoaded(true);
    setError(false);

    // Clear any pending retry timer on successful load
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [validSrc]);

  const gradient = getCategoryGradient(category);

  // Fallback: category gradient placeholder
  const fallbackStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    ...style,
  };

  // The actual URL to use in <img> — already processed through proxy
  const displayUrl = processedUrl;
  const showImage = !error && displayUrl;

  if (fill) {
    // Absolute-positioned background image (for hero/slider)
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Always render gradient background as safety net */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${gradient[0]}33, ${gradient[1]}33)`,
        }} />
        {/* V162 FIX #1: key prop forces React re-mount when URL changes */}
        {showImage && (
          <img
            key={displayUrl}
            ref={imgRef}
            src={displayUrl}
            alt={alt}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: loaded ? (overlayOpacity ?? 1) : 0,
              // V120: Faster transition when coming from cache (instant feel)
              transition: loaded && loadedUrls.has(validSrc || '') ? 'none' : 'opacity 0.6s ease',
            }}
          />
        )}
      </div>
    );
  }

  // Regular image with gradient fallback
  // V234 FIX: Always spread the caller's `style` prop (contains height: '100%'
  // from NewsBigCard etc.). Previously it was only applied in error/fallback mode,
  // causing the outer div to collapse to 0px height when the inner <img> was
  // absolutely-positioned — images loaded but were invisible.
  return (
    <div
      className={className}
      style={{
        width: width || '100%',
        height: height || 'auto',
        position: 'relative',
        overflow: 'hidden',
        ...style,  // V234: Always apply caller's style (height, width, etc.)
        ...(error ? { background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` } : {}),
      }}
    >
      {/* V162 FIX #1: key prop forces React re-mount when URL changes */}
      {showImage && (
        <img
          key={displayUrl}
          ref={imgRef}
          src={displayUrl}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            // V120: No transition when coming from cache
            transition: loaded && loadedUrls.has(validSrc || '') ? 'none' : 'opacity 0.4s ease',
            position: 'absolute',
            inset: 0,
          }}
        />
      )}
      {/* Gradient fallback when image fails — never show broken icon */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}
    </div>
  );
}
