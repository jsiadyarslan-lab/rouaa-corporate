// ─── Rate Limiting + Security + i18n Middleware V342 ──────────
// Protects public API routes from abuse.
// Detects locale from URL path (/en = English, /fr = French, /tr = Turkish, /es = Spanish, else Arabic).
// Sets x-locale header so root layout can render correct shell.
// V247: Added locale detection for English/Arabic routing.
// V248: Added rewrite for English slugs at root path → /en/news/[slug].
// V250: Fixed /stock-analysis false-positive redirect to /en/news/stock-analysis.
// V252: Added French locale detection — /fr/ now sets x-locale: fr.
// V342: Added Turkish locale detection — /tr/ now sets x-locale: tr.
// ES: Added Spanish locale detection — /es/ now sets x-locale: es.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store
const rateLimits = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupOldEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimits) {
    if (now > entry.resetTime) {
      rateLimits.delete(key);
    }
  }
}

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }
  return 'unknown';
}

function isInternalRequest(request: NextRequest): boolean {
  const internalHeader = request.headers.get('x-internal');
  if (!internalHeader) return false;
  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!internalSecret) return false;
  return internalHeader === internalSecret;
}

// ─── V247: Detect locale from pathname ───────────────────────
function detectLocale(pathname: string): 'ar' | 'en' | 'es' | 'fr' | 'tr' {
  // /en, /en/news, /en/reports, etc.
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  // V252: /fr, /fr/news, /fr/reports, etc.
  if (pathname === '/fr' || pathname.startsWith('/fr/')) return 'fr';
  // V342: /tr, /tr/news, /tr/reports, etc.
  if (pathname === '/tr' || pathname.startsWith('/tr/')) return 'tr';
  // ES: /es, /es/news, /es/reports, etc.
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es';
  return 'ar';
}

// ─── V248→V249: Detect if a root-level slug should be redirected ─
// Latin slugs could belong to EN, ES, FR, or TR articles.
// We can't determine the locale from the slug alone (they all use Latin chars),
// so we redirect to a DB-lookup route that determines the correct locale.
// Arabic slugs always stay at root (Arabic is the default locale).
function isLatinNewsSlug(pathname: string): boolean {
  const segment = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  if (!segment || segment.includes('/')) return false;

  // V250: Expanded known routes — also match hyphenated compounds
  // e.g., "stock-analysis-aapl" starts with "stock-analysis-" which is a known route prefix
  const knownRoutes = [
    // Original routes
    'news', 'reports', 'article', 'en', 'ar', 'es', 'fr', 'tr', 'dashboard',
    'api', 'infographics', 'bookmarks', 'search', 'archive', 'tg', 'admin',
    'strategic-reports', 'arabic-markets', 'sitemap.xml', 'robots.txt',
    'favicon.ico', 'manifest.webmanifest', '_next', 'library',
    // V249: Added all valid app routes to prevent isEnglishSlug false positives
    'analysis', 'stock-analysis', 'signals', 'markets', 'calendar',
    'advisor', 'portfolio', 'flash', 'earnings', 'central-banks',
    'community', 'pricing', 'telegram', 'academy', 'videos', 'blog',
    'about', 'contact', 'careers', 'terms', 'privacy', 'disclaimer',
    'aml', 'auth', 'market-pulse', 'compare', 'alerts', 'compliance',
    'docs', 'not-found', 'coach', 'market', 'scanner', 'settings',
    'profile', 'notifications', 'support', 'faq', 'help',
    'onboarding',
    // V343: Geopolitical Risks — prevents isLatinNewsSlug redirect to /article/geopolitical-risks
    'geopolitical-risks', 'economic-calendar',
    // V1219d: Technical analyses page — was being redirected to /article/technical-analyses (404)
    // because 'technical-analyses' (19 chars) matched the Latin slug ≥10 rule
    'technical-analyses',
  ];
  // V250: Also match segment starting with knownRoute + "-" (e.g., stock-analysis-aapl)
  if (knownRoutes.some(r => segment === r || segment.startsWith(r + '/') || segment.startsWith(r + '-'))) return false;

  // Skip Arabic characters — they stay at root (Arabic locale)
  if (/[\u0600-\u06FF]/.test(segment)) return false;

  // Latin-character slugs ≥10 chars: could be EN, ES, FR, or TR
  if (/^[a-z0-9-]+$/.test(segment) && segment.length >= 10) return true;

  return false;
}

// Routes with stricter limits
const DIAGNOSTIC_ROUTES = ['/api/news/health', '/api/monitoring', '/api/db-diag', '/api/db/count'];
const DIAGNOSTIC_LIMIT = 10;
const PUBLIC_API_PREFIX = '/api/';
const PUBLIC_API_LIMIT = 150;
const WINDOW_MS = 60 * 1000;

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const locale = detectLocale(pathname);

  // V247: Set x-locale header so root layout can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  // V155: Add security headers to ALL responses
  const addSecurityHeaders = (response: NextResponse): NextResponse => {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.delete('X-Powered-By');
    return response;
  };

  // For non-API routes: set locale header + security headers, skip rate limiting
  if (!pathname.startsWith('/api/')) {
    // NOTE: /stock-analysis and /en/stock-analysis have their own dedicated pages
    // (src/app/[locale]/stock-analysis/ and src/app/en/stock-analysis/)
    // Do NOT rewrite them to /analysis — that replaces stock analysis with the AI analysis page.

    // V405: /ar/ rewrite is now handled by next.config.mjs rewrites (not middleware).
    // next.config.mjs rewrites are included in the client-side route manifest,
    // so <Link href="/ar/stock-analysis"> works for client-side navigation too.
    // Middleware rewrites are NOT visible to the client-side router, which caused 404s.
    // The middleware still detects locale from /ar/ URLs and sets x-locale: ar.
    // File-system routes (/dashboard/ar/) take priority over rewrites, so admin is safe.

    // V249: Redirect Latin slugs at root to /article/[slug] which will
    // detect the article's locale and redirect to the correct language path.
    // Previously this always redirected to /en/news/ which was wrong for ES/FR/TR.
    if (isLatinNewsSlug(pathname)) {
      const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      const redirectUrl = new URL(`/article/${slug}`, request.url);
      const response = NextResponse.redirect(redirectUrl, 308);
      return addSecurityHeaders(response);
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return addSecurityHeaders(response);
  }

  // V119: Exclude NextAuth routes from rate limiting entirely.
  if (pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return addSecurityHeaders(response);
  }

  // V410: Exclude image/asset routes from rate limiting — these are CDN-cached
  // and each page load triggers 10+ image requests which consume the rate limit.
  if (pathname.startsWith('/api/article-image/')) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return addSecurityHeaders(response);
  }

  // ─── Rate limiting for public API routes ────────────────────
  cleanupOldEntries();

  const clientId = getClientId(request);
  const isInternal = isInternalRequest(request);

  // Skip rate limiting for internal requests
  if (isInternal) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return addSecurityHeaders(response);
  }

  // Check for diagnostic routes with stricter limits
  const isDiagnostic = DIAGNOSTIC_ROUTES.some(r => pathname.startsWith(r));
  const limit = isDiagnostic ? DIAGNOSTIC_LIMIT : PUBLIC_API_LIMIT;

  const key = `${clientId}:${Math.floor(Date.now() / WINDOW_MS)}`;
  const entry = rateLimits.get(key);

  if (entry) {
    entry.count++;
  } else {
    rateLimits.set(key, { count: 1, resetTime: Date.now() + WINDOW_MS });
  }

  const currentCount = entry ? entry.count : 1;

  if (currentCount > limit) {
    const response = NextResponse.json(
      { error: 'Too many requests', retryAfter: WINDOW_MS / 1000 },
      { status: 429 }
    );
    response.headers.set('Retry-After', String(WINDOW_MS / 1000));
    return addSecurityHeaders(response);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
