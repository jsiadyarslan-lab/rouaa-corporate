# ─── Dockerfile for رؤى (Rouaa) Trading News Platform V61 ───
# Multi-stage build for Next.js 16 standalone output on Railway
# Uses Supabase PostgreSQL (not SQLite)
# V58: Inject GIT_SHA + BUILD_DATE for deployment verification
# V60: Force rebuild for V335 video generation fix (reduce FPS, faster FFmpeg)
# V61: Fix build timeout — use COPY --chown and targeted chown instead of chown -R /app

# Stage 1: Dependencies & Build (combined for faster builds)
FROM node:20-slim AS builder
WORKDIR /app

# V58: Inject build metadata for deployment verification
ARG GIT_SHA=local
ARG BUILD_DATE=default
ARG BUILD_VERSION=dev
RUN echo "Build date: ${BUILD_DATE}"

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files first (for better caching)
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies with npm
RUN npm install --legacy-peer-deps

# Copy Prisma schema
COPY prisma ./prisma/

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Dummy DATABASE_URL for build (Supabase URL provided at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client (use local install, NOT npx which resolves to latest v7+ with breaking changes)
RUN if [ -f ./node_modules/.bin/prisma ]; then \
      ./node_modules/.bin/prisma generate; \
    else \
      npx prisma generate; \
    fi

# Build Next.js with standalone output
RUN npm run build:standalone

# V91: Fix nested standalone output (Next.js may nest under project name subdirectory
# when it detects lockfiles in parent directories or infers wrong workspace root)
RUN if [ -d .next/standalone/rouatradingnews ]; then \
      echo "⚠ Nested standalone detected — flattening..." && \
      cp -r .next/standalone/rouatradingnews/.next .next/standalone/ 2>/dev/null; \
      cp -r .next/standalone/rouatradingnews/* .next/standalone/ 2>/dev/null; \
      rm -rf .next/standalone/rouatradingnews; \
    fi

# V130g: Only purge ISR DATA cache from standalone build.
# CRITICAL: Do NOT delete .next/server/app/news or .next/server/app/article!
# Those directories contain compiled page.js modules that Next.js needs.
# Deleting them causes MODULE_NOT_FOUND errors at runtime.
# With force-dynamic, 404s won't be ISR-cached anyway.
RUN rm -rf .next/standalone/.next/cache/isr \
    .next/standalone/.next/cache/fetch-cache \
    2>/dev/null || true
RUN echo "✓ V130g: ISR data cache purged from standalone build (page modules preserved)"

# Stage 2: Production Runner
FROM node:20-slim AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime + curl for healthcheck
# V320: Also install Python3 + FFmpeg + pip for server-side video generation
# V4.3: Install Playwright system deps (NOT system chromium — it crashes on Railway)
# Playwright's own bundled Chromium will be downloaded separately below.
RUN apt-get update && apt-get install -y \
    openssl curl python3 python3-pip python3-venv ffmpeg unzip \
    fonts-noto-core fonts-noto-cjk fonts-noto-cjk-extra \
    fonts-hosny-amiri \
    libnss3 libatk-bridge2.0-0 libatk1.0-0 libcups2 libxdamage1 \
    libxkbcommon0 libxcomposite1 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libxshmfence1 libx11-xcb1 \
    && rm -rf /var/lib/apt/lists/*

# V9.3.1: Install IBM Plex Sans Arabic manually (not in Debian Bookworm apt repos).
# Download the variable font from the official GitHub repo and install to /usr/share/fonts.
# This ensures Arabic text renders correctly in Playwright (child process can't access next/font).
RUN curl -fsSL -o /tmp/ibm-plex-arabic.zip \
    "https://github.com/IBM/plex/releases/download/v6.4.0/IBM-Plex-Sans-Arabic.zip" \
    && mkdir -p /tmp/ibm-plex-arabic \
    && cd /tmp/ibm-plex-arabic \
    && unzip -q /tmp/ibm-plex-arabic.zip \
    && mkdir -p /usr/share/fonts/truetype/ibm-plex-arabic \
    && find /tmp/ibm-plex-arabic -name "*.ttf" -exec cp {} /usr/share/fonts/truetype/ibm-plex-arabic/ \; \
    && fc-cache -f \
    && rm -rf /tmp/ibm-plex-arabic /tmp/ibm-plex-arabic.zip \
    && echo "✓ IBM Plex Sans Arabic installed manually"

# V4.3: No need for crashpad fixes anymore — using Playwright's own Chromium
# which handles crashpad correctly out of the box.

# V320: Install Python packages for video generation
# edge-tts (free Arabic TTS) — still used for voiceover
# Pillow + matplotlib kept as fallback for legacy Python renderer
RUN pip3 install --break-system-packages --no-cache-dir \
    edge-tts>=7.0.0 \
    Pillow>=11.0.0 \
    matplotlib>=3.9.0 \
    2>/dev/null || pip3 install --no-cache-dir \
    edge-tts Pillow matplotlib

# Verify Python + FFmpeg are available
RUN python3 --version && ffmpeg -version | head -1 && echo 'V4.3: Python+FFmpeg ready (Playwright Chromium installed separately)'

# NOTE: No longer installing prisma CLI for runtime.
# prisma db push was causing data loss on every deploy.
# Table creation is now handled by ensureDBSchema() using safe raw SQL.

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
# V328: Fix TypeError: fetch failed in Railway Docker — force IPv4 DNS resolution
# Docker containers often have broken IPv6, causing undici fetch to fail silently
ENV NODE_OPTIONS=--dns-result-order=ipv4first
# V4.3: Tell Playwright where to find its bundled Chromium
# This must be set BEFORE npx playwright install so the browser is downloaded here
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nextjs/.cache/ms-playwright

# V58: BUILD_VERSION is set by docker-entrypoint.sh at runtime (not build time)
# because Railway doesn't pass Docker build args automatically.

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output — use --chown to set ownership at copy time (avoids massive chown -R at end)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# V142: Create writable directory for AI-generated infographic images
# These are generated at runtime by z-ai-generate CLI
# V320: Also create directory for generated videos
RUN mkdir -p ./public/generated/infographics ./public/generated/videos && \
    chown -R nextjs:nodejs ./public/generated

# V130g: Only purge ISR DATA cache in runner stage.
# CRITICAL: Do NOT delete .next/server/app/article or .next/server/app/news!
# Those directories contain the compiled page.js modules that Next.js needs
# to render pages. Deleting them causes MODULE_NOT_FOUND errors.
# With force-dynamic, Next.js won't ISR-cache 404s anyway.
RUN rm -rf .next/cache/isr .next/cache/fetch-cache 2>/dev/null || true
RUN echo "✓ V130g: ISR data cache purged (page modules preserved)"

# CRITICAL: Install z-ai-web-dev-sdk in the runner stage.
# The standalone build may not include dynamically imported packages.
# This SDK is the primary AI provider and must be available at runtime.
# V5.1: Also add its CLI (z-ai-generate) to PATH for video background generation.
RUN npm install --no-save z-ai-web-dev-sdk 2>/dev/null || true && \
    chown -R nextjs:nodejs /app/node_modules
ENV PATH="/app/node_modules/.bin:${PATH}"

# V130e: Install @aws-sdk/client-bedrock-runtime in the runner stage.
# The standalone build doesn't include this package because it's in
# serverExternalPackages. But it's required by ai-provider.ts which
# is imported by news-sources.ts (used by /news and /article pages).
# Without this, all pages that import news-sources.ts return 500.
RUN npm install --no-save @aws-sdk/client-bedrock-runtime 2>/dev/null || true && \
    chown -R nextjs:nodejs /app/node_modules

# CRITICAL: Create z-ai-web-dev-sdk config file from environment variables.
# V55: This is ALSO done in docker-entrypoint.sh at runtime (more reliable).
# The Dockerfile RUN command only works with build-time args, but Railway
# provides env vars at runtime. The entrypoint.sh handles the real case.
# This is kept as a fallback for non-Railway deployments that use build args.
RUN if [ -n "$ZAI_BASE_URL" ] && [ -n "$ZAI_API_KEY" ]; then \
      echo "{\"baseUrl\":\"$ZAI_BASE_URL\",\"apiKey\":\"$ZAI_API_KEY\"}" > /etc/.z-ai-config; \
    fi

# Copy Prisma client (needed for queries, NOT for db push)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# V320: Copy Python video generation script + fonts (legacy fallback)
COPY --from=builder --chown=nextjs:nodejs /app/scripts/generate_economic_video.py ./scripts/generate_economic_video.py
# V4: Copy Playwright-based professional video renderer
COPY --from=builder --chown=nextjs:nodejs /app/scripts/video-renderer.mjs ./scripts/video-renderer.mjs
# V323/V324: Copy DataViz (Al Jazeera style) video renderer — was missing, causing all dataviz videos to fail
COPY --from=builder --chown=nextjs:nodejs /app/scripts/video-renderer-dataviz.mjs ./scripts/video-renderer-dataviz.mjs
COPY --from=builder --chown=nextjs:nodejs /app/public/fonts ./public/fonts

# V4.3: Install Playwright FULL package + download its own Chromium binary
# System Chromium from Debian apt is broken on Railway (crashpad + SIGTRAP).
# Playwright's own Chromium is tested for headless use and works reliably.
# NOTE: This must run BEFORE the USER nextjs directive.
# PLAYWRIGHT_BROWSERS_PATH is set above, so browser downloads to the right place.
RUN mkdir -p /home/nextjs/.cache && \
    npm install --no-save playwright && \
    npx playwright install chromium && \
    chown -R nextjs:nodejs /home/nextjs/.cache && \
    chown -R nextjs:nodejs /app/node_modules && \
    echo "V4.3: Playwright + bundled Chromium installed successfully"

# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Verify server.js exists
RUN ls -la /app/server.js || (echo "FATAL: server.js not found!" && exit 1)

# V61: Removed massive `chown -R nextjs:nodejs /app` that caused build timeout.
# Ownership is now set incrementally:
#   - COPY --chown=nextjs:nodejs on all COPY commands
#   - chown -R nextjs:nodejs /app/node_modules after each npm install
#   - chown -R nextjs:nodejs /home/nextjs/.cache after Playwright install
# This avoids traversing hundreds of thousands of files at the end.

USER nextjs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
