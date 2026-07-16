#!/bin/sh
# ─── Docker Entrypoint for رؤى (Rouaa) V5 ────────────────────
# Uses Supabase PostgreSQL
#
# V5 CHANGES:
#   - Added bootstrap trigger AFTER server starts (critical for initial news fill)
#   - Removed prisma db push entirely (was causing data loss)
#   - Table creation handled by ensureDBSchema() using safe raw SQL
#   - Pipeline worker now auto-restarts on crash

echo "Starting رؤى (Rouaa) Trading News Platform V328..."

# ── V328: DNS diagnostic & fix for Railway containers ──
# Docker containers on Railway often have broken IPv6 DNS resolution,
# causing 'TypeError: fetch failed' from Node.js built-in fetch (undici).
# This checks DNS resolution and adds Google DNS as fallback if needed.
echo "[V328] DNS diagnostic:"
cat /etc/resolv.conf 2>/dev/null | head -5
# V328: Simple DNS check using node (nslookup may not be available in slim image)
node -e "const dns=require('dns'); dns.lookup('image.pollinations.ai', {family:4}, (err,addr) => { if(err){console.warn('[V328] ⚠ DNS lookup failed:', err.message); process.exit(1)} else {console.log('[V328] ✓ DNS resolves: image.pollinations.ai →', addr)} })" 2>/dev/null || {
  echo "[V328] ⚠ DNS resolution may be slow — adding Google DNS fallback"
  # Add Google DNS as fallback (only if not already present)
  if ! grep -q '8.8.8.8' /etc/resolv.conf 2>/dev/null; then
    echo 'nameserver 8.8.8.8' >> /etc/resolv.conf 2>/dev/null || true
    echo 'nameserver 8.8.4.4' >> /etc/resolv.conf 2>/dev/null || true
    echo '[V328] ✓ Added Google DNS (8.8.8.8, 8.8.4.4) to /etc/resolv.conf'
  fi
}
# Force IPv4 DNS resolution (equivalent to --dns-result-order=ipv4first)
export NODE_OPTIONS="--dns-result-order=ipv4first${NODE_OPTIONS:+ $NODE_OPTIONS}"
echo "[V328] NODE_OPTIONS=$NODE_OPTIONS"

# ── V4.3: Playwright's bundled Chromium handles crashpad/sandbox correctly ──
# No need for crashpad workarounds anymore. System Chromium from Debian apt
# is NOT used — Playwright installs and manages its own Chromium binary.
# Ensure shared memory is writable (Chromium needs this)
chmod 777 /dev/shm 2>/dev/null || true

# ── V58: Capture Railway git metadata for health endpoint ──
# Railway auto-provides RAILWAY_GIT_COMMIT_SHA at runtime.
# Write it to a file the Next.js app can read via health endpoint.
if [ -n "$RAILWAY_GIT_COMMIT_SHA" ]; then
  echo "Railway commit SHA: $RAILWAY_GIT_COMMIT_SHA"
  echo "$RAILWAY_GIT_COMMIT_SHA" > /tmp/.git-sha
else
  echo "No RAILWAY_GIT_COMMIT_SHA found — version tracking will show 'local'"
  echo "local" > /tmp/.git-sha
fi

# Set BUILD_VERSION if not already set (from Dockerfile ARG)
export BUILD_VERSION="${BUILD_VERSION:-143.0.0}"

# ── V130g: Only purge ISR DATA cache, NOT server page modules ──
# CRITICAL FIX: Previous versions deleted /app/.next/server/app/article and
# /app/.next/server/app/news entirely, which removed the compiled page.js
# files that Next.js needs to RENDER the pages. This caused:
#   Error: Cannot find module '/app/.next/server/app/article/[slug]/page.js'
# With force-dynamic on all article/news pages, Next.js won't ISR-cache 404s
# at all, so we don't need to delete pre-rendered server pages.
# Only delete the ISR DATA cache (not the page modules).
echo "[V130g] Purging ISR data cache only (keeping page modules)..."
rm -rf /app/.next/cache/isr 2>/dev/null || true
rm -rf /app/.next/cache/fetch-cache 2>/dev/null || true
echo "[V130g] ISR data cache purged — page modules preserved"

# ── Check Database URL ──
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set!"
  echo "Set it to your Supabase PostgreSQL connection string:"
  echo "  postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
  exit 1
fi

echo "Database: PostgreSQL (configured)"

# ── CRITICAL: Create z-ai-web-dev-sdk config file at RUNTIME ──
# The SDK requires a .z-ai-config file for image generation.
# On Railway, environment variables are available at runtime (not build time).
# We create the config file from runtime env vars so the SDK can find it.
ZAI_CONFIG_CREATED=false
# V325: ZAI_BASE_URL defaults to internal API if not set
ZAI_BASE_URL_ACTUAL="${ZAI_BASE_URL:-https://internal-api.z.ai/v1}"
if [ -n "$ZAI_API_KEY" ]; then
  echo "Creating .z-ai-config from environment variables..."
  ZAI_CONFIG_JSON="{\"baseUrl\":\"$ZAI_BASE_URL_ACTUAL\",\"apiKey\":\"$ZAI_API_KEY\""
  [ -n "$ZAI_CHAT_ID" ] && ZAI_CONFIG_JSON="$ZAI_CONFIG_JSON,\"chatId\":\"$ZAI_CHAT_ID\""
  [ -n "$ZAI_USER_ID" ] && ZAI_CONFIG_JSON="$ZAI_CONFIG_JSON,\"userId\":\"$ZAI_USER_ID\""
  [ -n "$ZAI_TOKEN" ] && ZAI_CONFIG_JSON="$ZAI_CONFIG_JSON,\"token\":\"$ZAI_TOKEN\""
  ZAI_CONFIG_JSON="$ZAI_CONFIG_JSON}"
  echo "$ZAI_CONFIG_JSON" > /app/.z-ai-config
  # V55: Also write to /etc/ since the SDK searches there too
  echo "$ZAI_CONFIG_JSON" > /etc/.z-ai-config 2>/dev/null || true
  chmod 644 /app/.z-ai-config
  echo "✓ .z-ai-config created at /app/.z-ai-config and /etc/.z-ai-config (baseUrl: $ZAI_BASE_URL_ACTUAL)"
  ZAI_CONFIG_CREATED=true
else
  echo "WARNING: ZAI_API_KEY not set. Image generation will not work."
fi

# ── Check AI Provider Configuration ──
AI_CONFIGURED=false
[ -n "$GROQ_API_KEY" ] && { echo "  - Groq: YES"; AI_CONFIGURED=true; }
[ -n "$GOOGLE_AI_STUDIO_API_KEY" ] && { echo "  - Gemini: YES"; AI_CONFIGURED=true; }
[ -n "$GEMINI_API_KEY" ] && { echo "  - Gemini: YES"; AI_CONFIGURED=true; }
[ -n "$GLM_API_KEY" ] && { echo "  - GLM: YES"; AI_CONFIGURED=true; }
[ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ] && { echo "  - Bedrock: YES"; AI_CONFIGURED=true; }
[ -n "$HF_API_TOKEN" ] && { echo "  - HuggingFace: YES"; AI_CONFIGURED=true; }
[ -n "$OLLAMA_BASE_URL" ] || [ -n "$OLLAMA_API_KEY" ] && { echo "  - Ollama: YES"; AI_CONFIGURED=true; }
[ -n "$XAI_API_KEY" ] && { echo "  - Grok (xAI): YES"; AI_CONFIGURED=true; }

if [ "$AI_CONFIGURED" = "false" ]; then
  echo "WARNING: No AI provider configured. Auto-translation will be disabled."
  echo "News fetching (RSS + Finnhub) will still work but in English only."
fi

# ── CRITICAL: Start server FIRST so health checks pass ──
echo "Starting server immediately (health checks need this)..."
cd /app
node server.js &
SERVER_PID=$!

# Wait for server to be ready (max 30 seconds)
echo "Waiting for server to start..."
SERVER_READY=false
for i in $(seq 1 15); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null | grep -qE "200|503"; then
    echo "✓ Server is responding (attempt $i)"
    SERVER_READY=true
    break
  fi
  sleep 2
done

if [ "$SERVER_READY" = "false" ]; then
  echo "WARNING: Server not responding yet, but continuing"
fi

# ── NO MORE prisma db push! ──
# Table creation is handled by ensureDBSchema() using safe raw SQL.
# prisma db push was causing data loss by detecting schema drift and
# running destructive ALTER/DROP operations. Removing it entirely.
echo "Database schema will be initialized by the application (safe raw SQL)."

# ── V5: Trigger bootstrap for initial news fill ──
# instrumentation.ts also triggers bootstrap after 45s,
# but we also trigger it here as a backup to ensure news is fetched
# on EVERY server restart, not just the first deployment.
echo "Triggering initial news bootstrap (background, non-blocking)..."
BOOTSTRAP_URL="http://localhost:8080/api/news/bootstrap?force=true"
(
  sleep 20  # Wait a bit more for the server to fully initialize
  # V153: Use INTERNAL_SECRET env var instead of hardcoded 'rouaa-entrypoint'
  _INTERNAL_SECRET="${INTERNAL_SECRET:-${ADMIN_SECRET}}"
  echo "[Bootstrap] Triggering: $BOOTSTRAP_URL"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 \
    -H "x-internal: $_INTERNAL_SECRET" \
    "$BOOTSTRAP_URL" 2>/dev/null || echo "000")
  echo "[Bootstrap] Response code: $HTTP_CODE"
  
  # If bootstrap succeeded, trigger agent-based pipeline
  if [ "$HTTP_CODE" = "200" ]; then
    echo "[Bootstrap] ✓ Success — triggering agent-based pipeline..."
    curl -s -o /dev/null --max-time 10 \
      -H "x-internal: $_INTERNAL_SECRET" \
      "http://localhost:8080/api/news/cron?action=trigger" 2>/dev/null || true
    sleep 3
    # Also fix any articles that are isReady=true but missing content
    curl -s -o /dev/null --max-time 10 \
      -H "x-internal: $_INTERNAL_SECRET" \
      "http://localhost:8080/api/news/fix-unready" 2>/dev/null || true
    # V344: Also trigger EN, FR, TR pipelines
    curl -s -o /dev/null --max-time 10 \
      -H "x-internal: $_INTERNAL_SECRET" \
      "http://localhost:8080/api/news/cron-en?action=full-cycle&limit=5" 2>/dev/null || true
    curl -s -o /dev/null --max-time 10 \
      -H "x-internal: $_INTERNAL_SECRET" \
      "http://localhost:8080/api/news/cron-fr?action=full-cycle&limit=5" 2>/dev/null || true
    curl -s -o /dev/null --max-time 10 \
      -H "x-internal: $_INTERNAL_SECRET" \
      "http://localhost:8080/api/news/cron-tr?action=full-cycle&limit=5" 2>/dev/null || true
    echo "[Bootstrap] ✓ Agent-based pipeline triggered (AR + EN + FR + TR)"
  else
    echo "[Bootstrap] ⚠️ Non-200 response ($HTTP_CODE) — pipeline worker will handle it"
  fi
) &
BOOTSTRAP_PID=$!

# ── V56: Warmup critical API routes ──
# After server start, hit key API routes via localhost to populate the
# Next.js ISR cache with proper 200 responses. Without this, the first
# external request (via CDN) might get a cached 404 from the Docker build.
echo "[V56] Warming up critical API routes..."
(
  sleep 5  # Wait for server to be fully ready
  for route in \
    "/api/ping" \
    "/api/news/cron?action=status" \
    "/api/news" \
    "/api/news/health" \
    "/api/news/manage?limit=1" \
    "/api/admin/pipeline" \
    "/api/dashboard" \
    "/api/markets" \
    "/api/articles"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
      -H "x-internal: $_INTERNAL_SECRET" \
      "http://localhost:8080${route}" 2>/dev/null || echo "000")
    echo "[V56 Warmup] ${route} → ${HTTP_CODE}"
  done
  
  # V57: Call revalidation endpoint to purge any ISR-cached 404s
  echo "[V57] Calling revalidation endpoint to purge ISR cache..."
  # V153: Use REVALIDATION_SECRET env var instead of hardcoded 'rouaa-revalidate'
  _REVALIDATION_SECRET="${REVALIDATION_SECRET:-${ADMIN_PASSWORD}}"
  REVALIDATE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "x-internal: $_INTERNAL_SECRET" \
    "http://localhost:8080/api/revalidate?secret=$_REVALIDATION_SECRET" 2>/dev/null || echo "000")
  echo "[V57 Revalidation] → ${REVALIDATE_CODE}"
  
  echo "[V56] Warmup + revalidation complete"
) &

echo "Server is ready. Pipeline worker + bootstrap + warmup scheduled in background."
echo "Pipeline worker runs automatically every 5 minutes."
wait $SERVER_PID
