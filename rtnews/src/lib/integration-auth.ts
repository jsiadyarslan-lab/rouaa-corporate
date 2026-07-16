// ─── Integration Authentication V3 ─────────────────────────
// Verifies API Key-based authentication for cross-platform integration.
// Used by /api/integration/* routes to authorize requests from Roua Trading.
//
// V2: Added Circuit Breaker pattern to handle trading platform outages.
// V3: Added Rate Limiting + unified auth for public/integrated endpoints.
//
// Auth mechanism: X-Integration-Key header must match INTEGRATION_API_KEY env var.
// This is a server-to-server auth pattern — no browser cookies or user sessions.
// The API key is shared between both platforms and must be kept secret.
//
// Public access: Some endpoints (signals, news, reports) allow unauthenticated
// access from the news site's own frontend, but with rate limiting.
// Authenticated requests from the trading platform bypass rate limits.

import { NextRequest, NextResponse } from 'next/server';

// ─── Rate Limiter ───────────────────────────────────────────
// Simple in-memory rate limiter for integration endpoints.
// Tracks request counts per IP address with rolling time windows.
// Authenticated requests (with valid X-Integration-Key) bypass limits.

const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  'default': { windowMs: 60_000, maxRequests: 60 },     // 60 req/min default
  'signals': { windowMs: 60_000, maxRequests: 30 },     // 30 req/min
  'news':    { windowMs: 60_000, maxRequests: 30 },     // 30 req/min
  'reports': { windowMs: 60_000, maxRequests: 20 },     // 20 req/min
  'chart':   { windowMs: 60_000, maxRequests: 20 },     // 20 req/min
  'quote':   { windowMs: 60_000, maxRequests: 60 },     // 60 req/min (live prices)
  'sparkline': { windowMs: 60_000, maxRequests: 30 },   // 30 req/min
};

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    const config = RATE_LIMITS[key.split(':')[0]] || RATE_LIMITS['default'];
    if (now - entry.windowStart > config.windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60_000);

/**
 * Check if a public (unauthenticated) request is within rate limits.
 * Returns { allowed: true } if the request can proceed,
 * or { allowed: false, retryAfterMs } if the rate limit is exceeded.
 */
export function checkRateLimit(
  request: NextRequest | Request,
  endpoint: string
): { allowed: boolean; retryAfterMs?: number; remaining?: number } {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
  const ip =
    (request as NextRequest).headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (request as NextRequest).headers?.get('x-real-ip') ||
    'unknown';
  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || (now - entry.windowStart) >= config.windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

/**
 * Determine if a request is authenticated (has valid integration key)
 * and apply rate limiting for unauthenticated requests.
 * Returns { authenticated, rateLimited, rateLimitResult }.
 */
export function authenticateIntegrationRequest(
  request: NextRequest | Request,
  endpoint: string
): {
  authenticated: boolean;
  rateLimited: boolean;
  rateLimitResult?: { allowed: boolean; retryAfterMs?: number; remaining?: number };
} {
  const authenticated = verifyIntegrationKey(request);

  // Authenticated requests bypass rate limits
  if (authenticated) {
    return { authenticated: true, rateLimited: false };
  }

  // Unauthenticated — check rate limit
  const result = checkRateLimit(request, endpoint);
  return {
    authenticated: false,
    rateLimited: !result.allowed,
    rateLimitResult: result,
  };
}

// ─── Circuit Breaker ──────────────────────────────────────────
// Tracks consecutive failures when calling the trading platform.
// After MAX_FAILURES consecutive failures, the circuit opens and
// all subsequent calls are rejected immediately for COOLDOWN_MS.
// After cooldown, one trial request is allowed (half-open state).
// If it succeeds, the circuit closes. If it fails, cooldown restarts.

const CIRCUIT_BREAKER = {
  failures: 0,
  lastFailureAt: 0,
  isOpen: false,
  MAX_FAILURES: 5,
  COOLDOWN_MS: 30_000, // 30 seconds cooldown after circuit opens
};

/**
 * Check if the circuit breaker allows a request.
 * Returns true if the request can proceed, false if the circuit is open.
 */
export function isCircuitClosed(): boolean {
  if (!CIRCUIT_BREAKER.isOpen) return true;

  // Check if cooldown has elapsed → allow one trial request (half-open)
  const elapsed = Date.now() - CIRCUIT_BREAKER.lastFailureAt;
  if (elapsed >= CIRCUIT_BREAKER.COOLDOWN_MS) {
    console.warn('[Circuit Breaker] Half-open — allowing trial request');
    return true;
  }

  return false;
}

/**
 * Record a successful call to the trading platform.
 * Resets the failure counter and closes the circuit.
 */
export function recordCircuitSuccess(): void {
  CIRCUIT_BREAKER.failures = 0;
  CIRCUIT_BREAKER.isOpen = false;
}

/**
 * Record a failed call to the trading platform.
 * Increments the failure counter and opens the circuit if threshold is reached.
 */
export function recordCircuitFailure(): void {
  CIRCUIT_BREAKER.failures++;
  CIRCUIT_BREAKER.lastFailureAt = Date.now();

  if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.MAX_FAILURES) {
    if (!CIRCUIT_BREAKER.isOpen) {
      console.error(
        `[Circuit Breaker] OPENED after ${CIRCUIT_BREAKER.failures} consecutive failures. Cooldown: ${CIRCUIT_BREAKER.COOLDOWN_MS / 1000}s`
      );
    }
    CIRCUIT_BREAKER.isOpen = true;
  }
}

/**
 * Get the current circuit breaker status for health checks.
 */
export function getCircuitBreakerStatus(): { isOpen: boolean; failures: number; lastFailureAt: string } {
  return {
    isOpen: CIRCUIT_BREAKER.isOpen,
    failures: CIRCUIT_BREAKER.failures,
    lastFailureAt: CIRCUIT_BREAKER.lastFailureAt
      ? new Date(CIRCUIT_BREAKER.lastFailureAt).toISOString()
      : 'never',
  };
}

/**
 * Verify the integration API key from request headers.
 * Returns true if the key matches INTEGRATION_API_KEY env var.
 */
export function verifyIntegrationKey(request: NextRequest | Request): boolean {
  const apiKey = request.headers.get('x-integration-key');
  const expectedKey = process.env.INTEGRATION_API_KEY;

  // No key configured = no integration access
  if (!expectedKey) {
    console.warn('[Integration] INTEGRATION_API_KEY not configured — integration access denied');
    return false;
  }

  // No key provided in request
  if (!apiKey) {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  if (apiKey.length !== expectedKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create a CORS-enabled response for integration endpoints.
 * Adds necessary CORS headers for cross-origin requests from the trading platform.
 */
export function createIntegrationResponse(data: any, status = 200): NextResponse {
  const partnerUrl = process.env.INTEGRATION_PARTNER_URL || '';
  const corsOrigins = [
    partnerUrl,
    'https://roua-trading-production.up.railway.app',
    // Allow any Railway deployment domain
  ].filter(Boolean);

  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': partnerUrl || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Integration-Key',
      'Access-Control-Max-Age': '86400', // 24 hours preflight cache
      'Cache-Control': 'public, max-age=5', // Short cache for integration data
    },
  });
}

/**
 * Create an error response for integration endpoints.
 */
export function createIntegrationError(message: string, status = 401): NextResponse {
  return createIntegrationResponse(
    {
      error: message,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

/**
 * Get the trading platform URL from environment.
 */
export function getTradingPlatformUrl(): string {
  return process.env.INTEGRATION_PARTNER_URL || 'https://roua-trading-production.up.railway.app';
}

/**
 * Get the integration API key for outgoing requests TO the trading platform.
 */
export function getIntegrationApiKey(): string {
  return process.env.INTEGRATION_API_KEY || '';
}

/**
 * Fetch data from the trading platform with integration auth + Circuit Breaker.
 * Use this in server-side API routes to call the trading platform.
 *
 * V2: Circuit Breaker integration — if the platform has failed consecutively,
 * requests are rejected immediately without waiting for timeout.
 */
export async function fetchFromTradingPlatform(path: string, options?: RequestInit): Promise<Response> {
  // Check circuit breaker first
  if (!isCircuitClosed()) {
    const cooldownLeft = Math.max(0, CIRCUIT_BREAKER.COOLDOWN_MS - (Date.now() - CIRCUIT_BREAKER.lastFailureAt));
    throw new Error(`Circuit breaker OPEN — trading platform unreachable. Retry in ${Math.ceil(cooldownLeft / 1000)}s`);
  }

  const baseUrl = getTradingPlatformUrl();
  const apiKey = getIntegrationApiKey();

  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Integration-Key': apiKey,
    ...(options?.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // 10 second timeout for integration calls
      signal: AbortSignal.timeout(10000),
    });

    // Record success for any response (even 4xx/5xx from platform)
    // We only count network failures as circuit breaker triggers
    if (response.ok) {
      recordCircuitSuccess();
    }

    return response;
  } catch (error: any) {
    // Network failure — record for circuit breaker
    recordCircuitFailure();
    console.error(`[Integration] Failed to fetch from trading platform: ${url}`, error?.message);
    throw new Error(`Trading platform unreachable: ${error?.message}`);
  }
}
