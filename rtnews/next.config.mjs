/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // CRITICAL: z-ai-web-dev-sdk must be externalized for standalone builds.
  // Without this, the dynamic import in ai-provider.ts fails at runtime on Railway
  // because the package is not included in the standalone output.
  serverExternalPackages: ['z-ai-web-dev-sdk', 'ioredis', '@aws-sdk/client-bedrock-runtime', '@napi-rs/canvas', 'sharp'],
  // ESLint is configured via eslint.config.mjs (Flat Config) in Next.js 16+.
  // The `lint` key was removed — it's invalid in Next.js 16+.
  // TypeScript build errors are currently suppressed — TODO: fix all TS errors and remove this
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,

  // V130: Removed staleTimes (was conflicting with revalidate=60 on pages).
  // Now using force-dynamic on article/news pages instead of ISR,
  // so staleTimes is no longer needed.
  experimental: {
  },

  // V405: Rewrite /ar/* to root pages so Arabic URLs work for BOTH server and client navigation.
  // Unlike middleware rewrites, next.config.mjs rewrites are included in the client-side
  // route manifest, so <Link href="/ar/stock-analysis"> works for client-side navigation too.
  // File-system routes (e.g., /dashboard/ar/) take priority over rewrites, so admin routes are safe.
  async rewrites() {
    return [
      { source: '/ar', destination: '/' },
      { source: '/ar/:path*', destination: '/:path*' },
    ];
  },

  async redirects() {
    return [];
  },
  // V91: Explicitly set turbopack.root to '.' to prevent Next.js from inferring
  // the workspace root from lockfiles in parent directories. Without this,
  // Next.js detects /bun.lock in parent and nests the standalone output
  // in a subdirectory (e.g., .next/standalone/rouatradingnews/server.js),
  // which breaks the Dockerfile that expects .next/standalone/server.js.
  turbopack: {
    root: new URL('.', import.meta.url).pathname.replace(/\/$/, ''),
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.reuters.com' },
      { protocol: 'https', hostname: '**.cnbc.com' },
      { protocol: 'https', hostname: '**.marketwatch.com' },
      { protocol: 'https', hostname: '**.yahoo.com' },
      { protocol: 'https', hostname: '**.finnhub.io' },
      { protocol: 'https', hostname: '**.investing.com' },
      { protocol: 'https', hostname: '**.alarabiya.net' },
      { protocol: 'https', hostname: '**.bing.com' },
      { protocol: 'https', hostname: 'fonts.googleapis.com' },
      { protocol: 'https', hostname: 'fonts.gstatic.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.wordpress.com' },
      { protocol: 'https', hostname: '**.wp.com' },
      { protocol: 'https', hostname: '**.b-cdn.net' },
      { protocol: 'https', hostname: '**.cdn.ampproject.org' },
      { protocol: 'https', hostname: '**.twimg.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      // REMOVED: Unsplash — only AI-generated images (Pollinations.ai) allowed
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: '**.pollinations.ai' },
      { protocol: 'https', hostname: '**.arabicnews.com' },
      { protocol: 'https', hostname: '**.alarabiya.net' },
      { protocol: 'https', hostname: '**.aljazeera.net' },
      { protocol: 'https', hostname: '**.skynewsarabia.com' },
      { protocol: 'https', hostname: '**.aawsat.com' },
      { protocol: 'https', hostname: '**.spa.gov.sa' },
      { protocol: 'https', hostname: '**.cryptopanic.com' },
      // V342: Turkish news sources
      { protocol: 'https', hostname: '**.dunya.com' },
      { protocol: 'https', hostname: '**.bloomberght.com' },
      { protocol: 'https', hostname: '**.hurriyet.com.tr' },
      { protocol: 'https', hostname: '**.bigpara.com' },
      { protocol: 'https', hostname: '**.trthaber.com' },
      { protocol: 'https', hostname: '**.haber7.com' },
      { protocol: 'https', hostname: '**.cointurk.com' },
      // V97: R2 image storage — Cloudflare R2 public URLs
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Security + Performance headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://s.tradingview.com https://*.tradingview.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.r2.dev https://*.cloudflarestorage.com https://*.reuters.com https://*.cnbc.com https://*.marketwatch.com https://*.yahoo.com https://*.finnhub.io https://*.investing.com https://*.alarabiya.net https://*.bing.com https://fonts.gstatic.com https://*.cloudinary.com https://*.wordpress.com https://*.wp.com https://*.b-cdn.net https://*.twimg.com https://*.ytimg.com https://*.cdn.ampproject.org https://image.pollinations.ai https://*.pollinations.ai https://*.aljazeera.net https://*.skynewsarabia.com https://*.aawsat.com https://*.spa.gov.sa https://*.cryptopanic.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.tradingview.com https://*.basemaps.cartocdn.com https://*.cartocdn.com; connect-src 'self' https://*.groq.com https://*.googleapis.com https://*.bigmodel.cn https://*.amazonaws.com https://*.huggingface.co https://*.finnhub.io https://fonts.googleapis.com https://fonts.gstatic.com https://api.openai.com https://generativelanguage.googleapis.com https://*.up.railway.app https://*.railway.app https://image.pollinations.ai https://*.pollinations.ai https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.tradingview.com wss://*.tradingview.com https://*.basemaps.cartocdn.com https://*.cartocdn.com https://d2ad6b4ur7yvpq.cloudfront.net; media-src 'self' https://*.r2.dev https://*.cloudflarestorage.com blob:; frame-src https://s.tradingview.com https://*.tradingview.com; frame-ancestors 'none'; worker-src 'self' blob:;" },
        ],
      },
      // General API routes — short cache (30s) for non-critical data
      // NOTE: Must come BEFORE specific API routes because Next.js applies
      // the LAST matching rule, so specific routes override this default.
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=30, stale-while-revalidate=60" },
        ],
      },
      // Geopolitical API routes — cache 300s, data changes infrequently
      // Bayesian, sentiment, scenario-tree, GNN, SIR contagion, confidence-intervals,
      // supply-chain-resilience are purely computational — no need to refresh every 30s
      {
        source: "/api/geopolitical-risks/(bayesian-escalation|sentiment|scenario-tree|gnn-correlation|sir-contagion|confidence-intervals|supply-chain-resilience)(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=600" },
        ],
      },
      // Geopolitical data APIs — cache 120s for risk scores, map data, events
      {
        source: "/api/geopolitical-risks/(risk-score|map-data|events|scenarios|economic-impact|market-impact|trade-routes)(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=120, stale-while-revalidate=300" },
        ],
      },
      // Market data APIs — cache 60s, serve stale for 120s while revalidating
      {
        source: "/api/markets/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=120" },
        ],
      },
      // News API — cache 120s, serve stale for 300s while revalidating
      {
        source: "/api/news/live(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=120, stale-while-revalidate=300" },
        ],
      },
      // Reports & analyses — cache 300s, content changes infrequently
      {
        source: "/api/(reports|market-analyses|infographics)(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=600" },
        ],
      },
      // Article image proxy — cache 1 day, serve stale for 7 days
      {
        source: "/api/article-image/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Auth & user-specific APIs — never cache
      {
        source: "/api/auth/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      // Dashboard & admin APIs — never cache
      {
        source: "/api/dashboard/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      // V354: Prevent browser from caching stale 301 redirects for stock-analysis pages
      // Previous session added 301 permanent redirects /stock-analysis → /analysis which
      // browsers cache indefinitely. This ensures fresh responses for all stock-analysis routes.
      {
        source: "/:locale(en|fr|ar|tr)/stock-analysis/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/stock-analysis/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      // V75: Integration CORS headers — allow trading platform to call integration endpoints
      {
        source: "/api/integration/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.INTEGRATION_PARTNER_URL || "https://roua-trading-production.up.railway.app" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, X-Integration-Key" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
      // V4 calendar: Prevent browser/CDN from caching stale calendar HTML.
      // Without this, users may see a cached old version of /calendar even
      // after a new deploy. Calendar pages must always render fresh.
      {
        source: "/:locale(en|fr|tr|es)/calendar/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/calendar/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      // V4 strategic-reports: same no-cache treatment — page was notorious for
      // showing stale text-list version after deploys.
      {
        source: "/:locale(en|fr|tr|es)/strategic-reports/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/strategic-reports/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      // V4 technical-analyses: same no-cache treatment for the new page.
      {
        source: "/:locale(en|fr|tr|es)/technical-analyses/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/technical-analyses/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*).svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
